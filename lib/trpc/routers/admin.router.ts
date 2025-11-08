// lib/trpc/routers/admin.router.ts
import { router } from "../server";
import { adminProcedure } from "../middlewares/adminAuth";
import { z } from "zod";

export const adminRouter = router({
  getDashboardMetrics: adminProcedure.query(async ({ ctx }) => {
    // These would be more complex queries in a real application
    const { count: totalPatients, error: patientError } = await ctx.supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: appointmentsToday, error: apptError } = await ctx.supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", new Date().toISOString().split("T")[0]);

    // Handle potential errors
    if (patientError || apptError) {
      throw new Error("Failed to fetch dashboard metrics.");
    }

    return {
      totalPatients: totalPatients ?? 0,
      appointmentsToday: appointmentsToday ?? 0,
      monthlyRevenue: 12345.67, // Placeholder value
    };
  }),

  getUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(5).max(100).default(10),
      filter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const query = ctx.supabase
        .from("users")
        .select("id, full_name, email, role, is_active", { count: "exact" });
      
      if (input.filter) {
        query.ilike('full_name', `%${input.filter}%`);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (error) throw new Error("Failed to fetch users.");

      return { users: data, total: count ?? 0 };
    }),

  updateUser: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      role: z.enum(["patient", "doctor", "staff", "admin"]),
      is_active: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .update({ role: input.role, is_active: input.is_active })
        .eq("id", input.id);
      
      if (error) throw new Error("Failed to update user.");
      return { success: true };
    }),
});
