// lib/trpc/root.ts
import { router, publicProcedure } from "./server";
import { router, publicProcedure } from "./server";
import { patientRouter } from "./routers/patient.router";
import { appointmentRouter } from "./routers/appointment.router";
import { clinicRouter } from "./routers/clinic.router";
import { doctorRouter } from "./routers/doctor.router";
import { consultationRouter } from "./routers/consultation.router";
import { adminRouter } from "./routers/admin.router";
// import { reportsRouter } from "./routers/reports.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),
  
  // Existing Routers
  patient: patientRouter,
  appointment: appointmentRouter,
  clinic: clinicRouter,
  doctor: doctorRouter,
  consultation: consultationRouter,

  // Admin Portal Routers
  admin: adminRouter,
  // reports: reportsRouter, // To be added
});

export type AppRouter = typeof appRouter;
