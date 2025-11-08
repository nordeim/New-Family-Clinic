// @/lib/trpc/routers/appointment.router.ts
import { router, publicProcedure, protectedProcedure } from "../server";
import { z } from "zod";
import { createAppointmentSchema } from "@/types/zod-schemas";

export const appointmentRouter = router({
  getAvailableDoctors: publicProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("doctors")
        .select(`
          id,
          consultation_fee,
          users (
            full_name,
            display_name
          )
        `)
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true); // Assuming doctors table has an is_active field

      if (error) {
        throw new Error("Failed to fetch available doctors.");
      }
      return data;
    }),
  
  getAvailableSlots: publicProcedure
    .input(z.object({ doctorId: z.string().uuid(), date: z.string() }))
    .query(async ({ ctx, input }) => {
      // This is a simplified query. A real-world scenario would involve
      // a function that generates slots based on doctor's working hours
      // and checks against existing appointments.
      const { data, error } = await ctx.supabase
        .from("appointment_slots")
        .select("slot_time, is_available")
        .eq("doctor_id", input.doctorId)
        .eq("slot_date", input.date)
        .order("slot_time");
      
      if (error) {
        throw new Error("Failed to fetch available slots.");
      }
      return data;
    }),

  createAppointment: protectedProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      // The robust implementation for this would be to call the 
      // `booking.create_booking` stored procedure defined in the database migrations.
      // This ensures atomicity and prevents race conditions.
      const { data, error } = await ctx.supabase.rpc("create_booking", {
        p_idempotency_key: crypto.randomUUID(), // A real app would get this from client
        p_user_id: ctx.user.id,
        p_clinic_id: input.clinicId,
        // p_slot_id: needs to be derived or passed from client
        p_patient_id: "...", // needs to be fetched based on user_id
        p_visit_reason: input.visitReason,
      });

      if (error) {
        console.error("Error creating appointment:", error);
        throw new Error(`Booking failed: ${error.message}`);
      }
      return data;
    }),
});
