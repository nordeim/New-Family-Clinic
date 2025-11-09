// lib/trpc/routers/payment.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { stripeService } from "@/lib/integrations/stripe";
import { CHASCalculator } from "@/lib/utils/chas-calculator";
import { type ChasCardType } from "@/types/database.types";
import { TRPCError } from "@trpc/server";

export const paymentRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch appointment and patient data to verify ownership and get details
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select(`consultation_fee, patients!inner(id, chas_card_type)`)
        .eq("id", input.appointmentId)
        .eq("patients.user_id", ctx.user.id) // Security: ensure user owns this appointment
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment not found or you do not have permission to pay for it.",
        });
      }

  const consultationFee = appointment.consultation_fee ?? 0;
      if (consultationFee <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment is required for this appointment." });
      }

          // 2. Calculate final amount with CHAS subsidy
          // Supabase `select(...!inner(...))` can return an array for nested relations.
          type PatientShape = { id?: string; chas_card_type?: string };
          const patientsField = (appointment as Record<string, unknown>).patients;
          const patient: PatientShape | undefined = Array.isArray(patientsField)
            ? (patientsField[0] as PatientShape)
            : (patientsField as PatientShape | undefined);

      const rawChas = patient?.chas_card_type as unknown;
      const chasCardType: ChasCardType =
        rawChas === "blue" || rawChas === "orange" || rawChas === "green" || rawChas === "none"
          ? (rawChas as ChasCardType)
          : "none";

      const { subsidyAmount, finalAmount } = CHASCalculator.calculate({
        chasCardType,
        consultationFee,
      });
      
      const finalAmountInCents = Math.round(finalAmount * 100);

      // 3. Create a pending payment record in our database
      const { data: paymentRecord, error: paymentError } = await ctx.supabase
        .from("payments")
        .insert({
          appointment_id: input.appointmentId,
          patient_id: patient?.id,
          clinic_id: "...", // Fetch from appointment
          subtotal: consultationFee,
          chas_subsidy_amount: subsidyAmount,
          total_amount: finalAmount,
          status: "pending",
          payment_method: "stripe",
          // These are placeholder values
          payment_number: `PAY-${Date.now()}`,
          receipt_number: `REC-${Date.now()}`,
        })
        .select("id")
        .single();

      if (paymentError || !paymentRecord) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create payment record." });
      }
      
      // 4. Create the Stripe Payment Intent
      try {
        const paymentIntent = await stripeService.createPaymentIntent(
          finalAmountInCents,
          "sgd",
          {
            appointmentId: input.appointmentId,
            paymentId: String(paymentRecord.id), // Our internal payment ID as string
            patientId: patient?.id ?? "",
          }
        );

        // 5. Update our payment record with the Stripe intent ID
        await ctx.supabase
          .from("payments")
          .update({ payment_intent_id: paymentIntent.id })
          .eq("id", paymentRecord.id);

        return {
          clientSecret: paymentIntent.client_secret,
          totalAmount: finalAmount,
          subsidyAmount: subsidyAmount,
          originalAmount: consultationFee,
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Stripe payment intent.",
          cause: e,
        });
      }
    }),
});
