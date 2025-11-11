// lib/trpc/routers/payment.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { stripeService } from "@/lib/integrations/stripe";
import { CHASCalculator } from "@/lib/utils/chas-calculator";
import { TRPCError } from "@trpc/server";

/**
 * Utility for generating human-readable, unique identifiers.
 * These are not cryptographic; they are business ids layered on top of UUID PKs.
 */
const generateBusinessId = (prefix: string): string => {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}${rand}`;
};

export const paymentRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch appointment & patient to:
      //    - Verify the appointment belongs to the authenticated user.
      //    - Get clinic_id, patient_id, and consultation_fee.
      //
      // NOTE:
      // - ctx.session.user.id (via protectedProcedure) is the canonical identity.
      // - Supabase here is used purely as a DB client; identity comes from NextAuth.
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select(
          `
            id,
            clinic_id,
            patient_id,
            consultation_fee,
            patients!inner(
              id,
              user_id,
              chas_card_type
            )
          `,
        )
        .eq("id", input.appointmentId)
        .eq("patients.user_id", ctx.user.id) // Ownership: appointment's patient is current user
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Appointment not found or you do not have permission to pay for it.",
        });
      }

      const consultationFee = appointment.consultation_fee ?? 0;
      if (consultationFee <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No payment is required for this appointment.",
        });
      }

      // 2. Extract patient and CHAS card details from nested relation.
      type PatientShape = {
        id?: string;
        user_id?: string;
        chas_card_type?: string | null;
      };

      const patientsField = (appointment as Record<string, unknown>).patients;
      const patient: PatientShape | undefined = Array.isArray(patientsField)
        ? (patientsField[0] as PatientShape)
        : (patientsField as PatientShape | undefined);

      if (!patient?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to resolve patient profile for this appointment. Please contact the clinic.",
        });
      }

      // Map CHAS value defensively.
      const validChas = new Set(["blue", "orange", "green", "none"]);
      const rawChas = (patient.chas_card_type ?? "none").toString();
      const chasCardType = validChas.has(rawChas) ? (rawChas as any) : "none";

      // 3. Calculate subsidy and final amount.
      const { subsidyAmount, finalAmount } = CHASCalculator.calculate({
        chasCardType,
        consultationFee,
      });

      const finalAmountInCents = Math.round(finalAmount * 100);
      if (finalAmountInCents <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No payable amount after subsidies/adjustments.",
        });
      }

      // 4. Create a pending payment record aligned with clinic.payments schema.
      //    - We set:
      //      - status = 'pending'
      //      - outstanding_amount = total_amount (not yet paid)
      //      - paid_amount = 0 at this stage
      //      - payment_date = today (UTC date)
      const paymentNumber = generateBusinessId("PAY");
      const receiptNumber = generateBusinessId("REC");
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const { data: paymentRecord, error: paymentError } = await ctx.supabase
        .from("payments")
        .insert({
          clinic_id: appointment.clinic_id,
          patient_id: patient.id,
          appointment_id: appointment.id,
          payment_number: paymentNumber,
          receipt_number: receiptNumber,
          payment_date: today,
          payment_method: "stripe",
          payment_gateway: "stripe",
          subtotal: consultationFee,
          chas_subsidy_amount: subsidyAmount,
          total_amount: finalAmount,
          paid_amount: 0,
          outstanding_amount: finalAmount,
          status: "pending",
        })
        .select("id")
        .single();

      if (paymentError || !paymentRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create payment record.",
        });
      }

      // 5. Create the Stripe Payment Intent.
      try {
        const paymentIntent = await stripeService.createPaymentIntent(
          finalAmountInCents,
          "sgd",
          {
            appointmentId: input.appointmentId,
            paymentId: String(paymentRecord.id),
            patientId: String(patient.id),
          },
        );

        // 6. Update our payment record with the Stripe intent ID.
        const { error: updateError } = await ctx.supabase
          .from("payments")
          .update({ payment_intent_id: paymentIntent.id })
          .eq("id", paymentRecord.id);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Payment intent created, but failed to link it to payment record.",
          });
        }

        return {
          clientSecret: paymentIntent.client_secret,
          totalAmount: finalAmount,
          subsidyAmount,
          originalAmount: consultationFee,
        };
      } catch (e) {
        // Best-effort cleanup could be added here (e.g., mark payment as failed).
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Stripe payment intent.",
          cause: e,
        });
      }
    }),
});
