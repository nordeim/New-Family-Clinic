import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { adminProcedure } from "../middlewares/adminAuth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin Router
 *
 * Extended with booking lead management endpoints:
 * - listPublicBookingRequests: view persisted leads from booking.public_booking_requests
 * - updatePublicBookingRequestStatus: update status lifecycle
 * - linkPublicBookingRequestToAppointment: associate a lead with a real appointment
 *
 * Design notes:
 * - All procedures are:
 *   - protected (require authenticated session)
 *   - wrapped with adminAuth (must be admin/staff role as defined by middleware)
 * - Uses Supabase admin client for DB access on the server.
 * - Returns minimal, non-sensitive data appropriate for internal dashboards.
 */

function getSupabaseFromContext(ctx: any) {
  // Prefer an admin client on ctx if available; otherwise fall back to a shared admin client.
  if (ctx.supabaseAdmin) return ctx.supabaseAdmin;
  if (ctx.supabase) return ctx.supabase;
  return createSupabaseAdminClient();
}

export const adminRouter = createTRPCRouter({
  /**
   * Stub: getUsers
   *
   * Provided to satisfy existing admin UI components (UserTable).
   * Returns an empty list for now. Replace with real implementation later.
   */
  getUsers: adminProcedure.query(async () => {
    return [];
  }),

  /**
   * Stub: getDashboardMetrics
   *
   * Provided to satisfy existing admin dashboard components.
   * Returns fixed zeroed metrics for now. Replace with real implementation later.
   */
  getDashboardMetrics: adminProcedure.query(async () => {
    return {
      totalPatients: 0,
      totalAppointmentsToday: 0,
      pendingLeads: 0,
      completedAppointmentsThisWeek: 0,
    };
  }),
  /**
   * List public booking requests (leads).
   *
   * Filters:
   * - status (optional)
   * - limit (optional, default 50)
   */
  listPublicBookingRequests: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(["new", "contacted", "confirmed", "cancelled"])
            .optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = getSupabaseFromContext(ctx);
      const { status, limit } = input ?? {};

      let query = supabase
        .from("booking.public_booking_requests")
        .select(
          [
            "id",
            "created_at",
            "updated_at",
            "clinic_id",
            "name",
            "phone",
            "contact_preference",
            "preferred_time_text",
            "reason",
            "source",
            "status",
            "appointment_id",
          ].join(", "),
        )
        .order("created_at", { ascending: false })
        .limit(limit ?? 50);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Failed to load booking leads: ${error.message ?? "unknown error"}`,
        );
      }

      return data ?? [];
    }),

  /**
   * Update the status of a public booking request lead.
   *
   * Allows staff/admin to mark leads as contacted / confirmed / cancelled.
   */
  updatePublicBookingRequestStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["new", "contacted", "confirmed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = getSupabaseFromContext(ctx);

      const { data, error } = await supabase
        .from("booking.public_booking_requests")
        .update({
          status: input.status,
        })
        .eq("id", input.id)
        .select("id, status")
        .maybeSingle();

      if (error) {
        throw new Error(
          `Failed to update booking lead status: ${
            error.message ?? "unknown error"
          }`,
        );
      }

      return data;
    }),

  /**
   * Link a public booking request to a real appointment.
   *
   * Used after staff/admin confirms a booking and creates an appointment
   * (e.g. via the authenticated booking pipeline).
   */
  linkPublicBookingRequestToAppointment: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        appointmentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = getSupabaseFromContext(ctx);

      const { data, error } = await supabase
        .from("booking.public_booking_requests")
        .update({
          appointment_id: input.appointmentId,
          status: "confirmed",
        })
        .eq("id", input.id)
        .select("id, status, appointment_id")
        .maybeSingle();

      if (error) {
        throw new Error(
          `Failed to link booking lead to appointment: ${
            error.message ?? "unknown error"
          }`,
        );
      }

      return data;
    }),
});
