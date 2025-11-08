// @/lib/trpc/root.ts

import { router, publicProcedure } from "./server";
import { patientRouter } from "./routers/patient.router";
import { appointmentRouter } from "./routers/appointment.router";
import { clinicRouter } from "./routers/clinic.router";
import { doctorRouter } from "./routers/doctor.router";
import { consultationRouter } from "./routers/consultation.router";
import { adminRouter } from "./routers/admin.router";
import { paymentRouter } from "./routers/payment.router";
// import { reportsRouter } from "./routers/reports.router"; // Placeholder for future phase

/**
 * This is the primary router for your entire server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  /**
   * A simple public health check endpoint to confirm the API is responsive.
   */
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),

  // =================================================================
  // PUBLIC & PATIENT PORTAL ROUTERS
  // =================================================================
  patient: patientRouter,
  appointment: appointmentRouter,
  clinic: clinicRouter,
  payment: paymentRouter, // Payment is primarily a patient-facing action

  // =================================================================
  // DOCTOR PORTAL ROUTERS
  // =================================================================
  doctor: doctorRouter,
  consultation: consultationRouter,
  // prescription: prescriptionRouter, // To be added in a future phase
  // mc: mcRouter, // To be added in a future phase

  // =================================================================
  // ADMIN PORTAL ROUTERS
  // =================================================================
  admin: adminRouter,
  // reports: reportsRouter, // To be added in a future phase
});

// export type definition of API
export type AppRouter = typeof appRouter;
