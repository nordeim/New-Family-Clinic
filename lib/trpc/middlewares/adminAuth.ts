// lib/trpc/middlewares/adminAuth.ts
import { TRPCError } from "@trpc/server";
import { t } from "../server";

/**
 * Reusable middleware to enforce 'admin' or 'superadmin' role.
 * Throws a TRPCError if the user is not authenticated or lacks the required role.
 */
export const adminProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  // Fetch the user's role from our public.users table
  const { data: userProfile, error } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (error || !userProfile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not retrieve user profile.",
    });
  }

  if (userProfile.role !== "admin" && userProfile.role !== "superadmin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now non-nullable
      userProfile: userProfile,
    },
  });
});
