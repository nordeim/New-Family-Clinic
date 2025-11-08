// @/lib/trpc/routers/patient.router.ts
import { router, protectedProcedure } from "../server";

export const patientRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("patients")
      .select(`
        *,
        users (
          full_name,
          email,
          phone
        )
      `)
      .eq("user_id", ctx.user.id)
      .single();

    if (error) {
      console.error("Error fetching patient profile:", error);
      throw new Error("Failed to fetch patient profile.");
    }
    return data;
  }),

  getAppointments: protectedProcedure.query(async ({ ctx }) => {
    const { data: patient, error: patientError } = await ctx.supabase
      .from("patients")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (patientError || !patient) {
      throw new Error("Could not find patient profile for the current user.");
    }
    
    const { data, error } = await ctx.supabase
      .from("appointments")
      .select(`
        *,
        doctors (
          users (
            full_name
          )
        ),
        clinics (
          name
        )
      `)
      .eq("patient_id", patient.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      throw new Error("Failed to fetch appointments.");
    }
    return data;
  }),

  getMedicalRecords: protectedProcedure.query(async ({ ctx }) => {
    // Similar logic to getAppointments, fetching from medical_records table
    // Placeholder for brevity
    return [];
  }),
});
