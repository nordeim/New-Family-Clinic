// lib/trpc/routers/telemedicine.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { dailyVideoProvider } from "@/lib/integrations/daily";
import { TRPCError } from "@trpc/server";

export const telemedicineRouter = router({
  getTelemedicineSession: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Verify the user (patient or doctor) is part of this appointment
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select("id, patient_id, doctor_id")
        .eq("id", input.appointmentId)
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found." });
      }

      const { data: doctorProfile } = await ctx.supabase.from("doctors").select("id").eq("user_id", ctx.user.id).single();
      const { data: patientProfile } = await ctx.supabase.from("patients").select("id").eq("user_id", ctx.user.id).single();

      const isDoctorForAppt = doctorProfile?.id === appointment.doctor_id;
      const isPatientForAppt = patientProfile?.id === appointment.patient_id;

      if (!isDoctorForAppt && !isPatientForAppt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to access this session." });
      }
      
      // 2. Check if a session already exists in our DB
      const { data: existingSession } = await ctx.supabase
        .from("telemedicine_sessions")
        .select("room_url")
        .eq("appointment_id", input.appointmentId)
        .single();

      if (existingSession?.room_url) {
        return { roomUrl: existingSession.room_url };
      }

      // 3. If not, create a new room via the Daily.co provider
      try {
        const room = await dailyVideoProvider.createRoom(input.appointmentId);
        
        // 4. Save the new session details to our database
        const { error: insertError } = await ctx.supabase
          .from("telemedicine_sessions")
          .insert({
            appointment_id: input.appointmentId,
            room_url: room.url,
            room_name: room.name,
            // These would be fetched from the appointment record
            clinic_id: "...",
            patient_id: "...",
            doctor_id: "...",
            session_token: "...", // A JWT or token could be generated here if needed
            scheduled_start: "...",
            scheduled_end: "...",
          });

        if (insertError) throw insertError;

        return { roomUrl: room.url };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Telemedicine session creation failed:", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create or retrieve the video session.",
        });
      }
    }),
});
