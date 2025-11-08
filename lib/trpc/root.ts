// lib/trpc/root.ts
import { router, publicProcedure } from "./server";
import { patientRouter } from "./routers/patient.router";
import { appointmentRouter } from "./routers/appointment.router";
import { clinicRouter } from "./routers/clinic.router";
import { doctorRouter } from "./routers/doctor.router";
import { consultationRouter } from "./routers/consultation.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),
  
  // Patient Portal Routers
  patient: patientRouter,
  appointment: appointmentRouter,
  clinic: clinicRouter,

  // Doctor Portal Routers
  doctor: doctorRouter,
  consultation: consultationRouter,
  // prescription: prescriptionRouter, // To be added
  // mc: mcRouter, // To be added
});

export type AppRouter = typeof appRouter;
