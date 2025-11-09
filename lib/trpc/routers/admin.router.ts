// lib/trpc/routers/admin.router.ts

import { router } from "../server";
import { adminProcedure } from "../middlewares/adminAuth";
import { z } from "zod";
import { enqueueJob } from "@/lib/jobs/queue";

export const adminRouter = router({
  /**
   * Fetches key metrics for the main admin dashboard.
   */
  getDashboardMetrics: adminProcedure.query(async ({ ctx }) => {
    const { count: totalPatients, error: patientError } = await ctx.supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: appointmentsToday, error: apptError } = await ctx.supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", new Date().toISOString().split("T")[0]);

    if (patientError || apptError) {
      console.error("Error fetching dashboard metrics:", patientError || apptError);
      throw new Error("Failed to fetch dashboard metrics.");
    }

    // Placeholder for revenue calculation
    const monthlyRevenue = 54321.90;

    return {
      totalPatients: totalPatients ?? 0,
      appointmentsToday: appointmentsToday ?? 0,
      monthlyRevenue: monthlyRevenue,
    };
  }),

  /**
   * Fetches a paginated and filterable list of all users in the system.
   */
  getUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(5).max(100).default(10),
      filter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const query = ctx.supabase
        .from("users")
        .select("id, full_name, email, role, is_active, created_at", { count: "exact" });
      
      if (input.filter) {
        query.ilike('full_name', `%${input.filter}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users.");
      }

  // Return `total` for compatibility with existing frontend components
  return { users: data, total: count ?? 0 };
    }),

  /**
   * Updates a specific user's role and active status.
   */
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(["patient", "doctor", "staff", "admin", "superadmin"]),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("users")
        .update({ role: input.role, is_active: input.isActive })
        .eq("id", input.userId);
      
      if (error) {
        console.error(`Error updating user ${input.userId}:`, error);
        throw new Error("Failed to update user.");
      }
      return { success: true };
    }),

  /**
   * Enqueues jobs to send a broadcast message to a target audience.
   */
  sendBroadcast: adminProcedure
    .input(z.object({
      channel: z.enum(["sms", "email"]),
      message: z.string().min(10, "Message must be at least 10 characters."),
      clinicId: z.string().uuid("Please select a clinic."),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch all patients for the selected clinic who have opted in to the specified channel.
      const { data: patients, error } = await ctx.supabase
        .from("patients")
        .select("users!inner(id, phone, email, notification_preferences)")
        .eq("clinic_id", input.clinicId);

      if (error) {
        console.error(`Error fetching patients for broadcast for clinic ${input.clinicId}:`, error);
        throw new Error("Could not fetch recipients for broadcast.");
      }

      let recipientsQueued = 0;
      const jobPromises: Promise<void>[] = [];

      // 2. Enqueue a job for each eligible patient.
      for (const patient of patients) {
        // The user profile is nested inside the patient data
        const user = patient.users;
        if (!user) continue;

        type NotificationPrefs = {
          sms?: { enabled?: boolean };
          email?: { enabled?: boolean };
        } | null | undefined;

        const prefs = user.notification_preferences as NotificationPrefs; // Narrowed type for notification preferences

        if (input.channel === "sms" && prefs?.sms?.enabled && user.phone) {
          jobPromises.push(enqueueJob("send-sms", { to: user.phone, message: input.message }));
          recipientsQueued++;
        } else if (input.channel === "email" && prefs?.email?.enabled && user.email) {
          jobPromises.push(enqueueJob("send-email", { to: user.email, subject: "An Update from Gabriel Family Clinic", message: input.message }));
          recipientsQueued++;
        }
      }
      
      await Promise.all(jobPromises);

      return { success: true, recipientsQueued };
    }),
});
