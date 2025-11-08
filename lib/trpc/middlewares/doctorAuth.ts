// lib/trpc/middlewares/doctorAuth.ts
import { TRPCError } from "@trpc/server";
import { t } from "../server"; // Assuming t is exported from server.ts

/**
 * This is a reusable middleware for tRPC procedures that enforces two conditions:
 * 1. The user must be authenticated.
 * 2. The user's role must be 'doctor'.
 *
 * It enriches the context with a non-nullable `user` object and a `doctorProfile` object.
 */
export const doctorProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  // 1. Check for authenticated user
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  // 2. Fetch the user's profile to check their role
  const { data: userProfile, error: userError } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (userError || !userProfile) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve user profile." });
  }

  // 3. Enforce 'doctor' role
  if (userProfile.role !== "doctor") {
    throw new TRPCError({ code: "FORBIDDEN", message: "User is not a doctor." });
  }
  
  // 4. Fetch the doctor's specific profile
  const { data: doctorProfile, error: doctorError } = await ctx.supabase
    .from("doctors")
    .select("id, clinic_id")
    .eq("user_id", ctx.user.id)
    .single();

  if (doctorError || !doctorProfile) {
     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve doctor profile." });
  }

  // 5. Pass down the enriched context
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now non-nullable
      doctorProfile: doctorProfile, // Add doctor-specific profile
    },
  });
});
