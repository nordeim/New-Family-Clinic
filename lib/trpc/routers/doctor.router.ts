// lib/trpc/routers/doctor.router.ts
import { router } from "../server";
import { doctorProcedure } from "../middlewares/doctorAuth";
import { z } from "zod";
import dayjs from "dayjs";

export const doctorRouter = router({
  getDashboardSummary: doctorProcedure.query(async ({ ctx }) => {
    const today = dayjs().format("YYYY-MM-DD");
    const { data: appointments, error } = await ctx.supabase
      .from("appointments")
      .select(`
        id, appointment_time, status,
        patients ( users ( full_name ) )
      `)
      .eq("doctor_id", ctx.doctorProfile.id)
      .eq("appointment_date", today)
      .order("appointment_time");

    if (error) throw new Error("Failed to fetch dashboard summary.");
    
    const waitingCount = appointments.filter(a => a.status === 'in_progress').length;

    return { appointments, waitingCount };
  }),

  getScheduleByDate: doctorProcedure
    .input(z.object({ date: z.string().date() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("appointments")
        .select(`*, patients(users(full_name))`)
        .eq("doctor_id", ctx.doctorProfile.id)
        .eq("appointment_date", input.date)
        .order("appointment_time");
        
      if (error) throw new Error("Failed to fetch schedule.");
      return data;
    }),

  searchPatients: doctorProcedure
    .input(z.object({ searchTerm: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      // Using pg_trgm for fuzzy search, installed in migration 001
      const { data, error } = await ctx.supabase
        .from("patients")
        .select(`id, users ( full_name, email )`)
        .eq("clinic_id", ctx.doctorProfile.clinic_id)
        .ilike("users.full_name", `%${input.searchTerm}%`) // Simplified search for now
        .limit(10);
      
      if (error) throw new Error("Failed to search for patients.");
      return data;
    }),
});
