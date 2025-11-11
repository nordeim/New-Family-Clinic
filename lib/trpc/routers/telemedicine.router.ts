// lib/trpc/routers/telemedicine.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { dailyVideoProvider } from "@/lib/integrations/daily";
import { TRPCError } from "@trpc/server";
import type { TelemedicineSessionRecord } from "@/types/db";

export const telemedicineRouter = router({
  getTelemedicineSession: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Verify the appointment exists and load core linkage fields.
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select("id, clinic_id, patient_id, doctor_id")
        .eq("id", input.appointmentId)
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment not found.",
        });
      }

      // 2. Resolve current user as doctor or patient using canonical user_id.
      const { data: doctorProfile } = await ctx.supabase
        .from("doctors")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      const { data: patientProfile } = await ctx.supabase
        .from("patients")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      const isDoctorForAppt = doctorProfile?.id === appointment.doctor_id;
      const isPatientForAppt = patientProfile?.id === appointment.patient_id;

      if (!isDoctorForAppt && !isPatientForAppt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this telemedicine session.",
        });
      }

      // 3. Check if a session already exists for this appointment.
      const {
        data: existingSession,
        error: existingError,
      } = await ctx.supabase
        .from("telemedicine_sessions")
        .select("room_url")
        .eq("appointment_id", input.appointmentId)
        .single<Pick<TelemedicineSessionRecord, "room_url">>();

      if (!existingError && existingSession?.room_url) {
        return { roomUrl: existingSession.room_url };
      }

      // 4. If not, create a new room via the Daily.co provider.
      try {
        const room = await dailyVideoProvider.createRoom(input.appointmentId);

        // Generate a basic opaque session token for now.
        // In future, replace with a signed JWT if per-user access control is required.
        const sessionToken = `sess_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

        // Derive a simple scheduled window as a safe default:
        // - scheduled_start: now
        // - scheduled_end: now + 60 minutes
        const now = new Date();
        const oneHourMs = 60 * 60 * 1000;
        const scheduledStart = now.toISOString();
        const scheduledEnd = new Date(now.getTime() + oneHourMs).toISOString();

        const { error: insertError } = await ctx.supabase
          .from("telemedicine_sessions")
          .insert({
            appointment_id: input.appointmentId,
            clinic_id: appointment.clinic_id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            room_url: room.url,
            room_name: room.name,
            session_token: sessionToken,
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
          });

        if (insertError) {
          // PDPA: do not log full payloads or PHI. This log is limited to technical details.
          console.error("Failed to persist telemedicine session", {
            appointmentId: input.appointmentId,
            message: insertError.message,
            code: insertError.code,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Video session created but could not be saved. Please try again.",
          });
        }
 
        return { roomUrl: room.url };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        // PDPA: never log PHI or full session context; this message is technical-only.
        console.error("Telemedicine session creation failed", {
          appointmentId: input.appointmentId,
          message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create or retrieve the video session.",
        });
      }
    }),
});
