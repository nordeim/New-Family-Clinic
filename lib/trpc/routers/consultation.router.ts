// lib/trpc/routers/consultation.router.ts
import { router } from "../server";
import { doctorProcedure } from "../middlewares/doctorAuth";
import { z } from "zod";

const consultationSchema = z.object({
  appointmentId: z.string().uuid(),
  chiefComplaint: z.string(),
  diagnosis: z.string(),
  treatmentPlan: z.string(),
  // ... other fields
});

export const consultationRouter = router({
  getPatientHistory: doctorProcedure
    .input(z.object({ patientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("medical_records")
        .select(`*, appointments(appointment_date)`)
        .eq("patient_id", input.patientId)
        .order("record_date", { ascending: false });

      if (error) throw new Error("Failed to fetch patient history.");
      return data;
    }),

  saveConsultation: doctorProcedure
    .input(consultationSchema)
    .mutation(async ({ ctx, input }) => {
      // In a real app, this would use UPSERT on appointment_id
      const { data, error } = await ctx.supabase
        .from("medical_records")
        .update({
          chief_complaint: input.chiefComplaint,
          primary_diagnosis: input.diagnosis,
          treatment_plan: input.treatmentPlan,
        })
        .eq("appointment_id", input.appointmentId);
      
      if (error) throw new Error("Failed to save consultation notes.");
      return { success: true };
    }),
});
