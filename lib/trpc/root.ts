// @/lib/trpc/root.ts
import { router, publicProcedure } from "./server";
import { patientRouter } from "./routers/patient.router";
import { appointmentRouter } from "./routers/appointment.router";
import { clinicRouter } from "./routers/clinic.router";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
  
  // Merge feature routers
  patient: patientRouter,
  appointment: appointmentRouter,
  clinic: clinicRouter,
});

export type AppRouter = typeof appRouter;
