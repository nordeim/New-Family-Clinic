// @/types/zod-schemas.ts
import { z } from "zod";

// Schema for the patient registration form
export const patientRegistrationSchema = z
  .object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().regex(/^[89]\d{7}$/, { message: "Please enter a valid Singapore mobile number." }),
    nric: z.string().regex(/^[STFG]\d{7}[A-Z]$/i, { message: "Please enter a valid NRIC number." }),
    dateOfBirth: z.string().refine((dob) => new Date(dob) < new Date(), { message: "Date of birth must be in the past." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Point error to the confirmPassword field
  });

export type PatientRegistrationSchema = z.infer<typeof patientRegistrationSchema>;

// Schema for creating a new appointment
export const createAppointmentSchema = z.object({
  clinicId: z.string().uuid(),
  doctorId: z.string().uuid(),
  slotDate: z.string(), // YYYY-MM-DD
  slotTime: z.string(), // HH:MM
  visitReason: z.string().optional(),
});

export type CreateAppointmentSchema = z.infer<typeof createAppointmentSchema>;
