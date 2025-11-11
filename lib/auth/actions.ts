// @/lib/auth/actions.ts
"use server";

/**
 * Identity Alignment Note
 *
 * This module previously attempted to:
 * - Use Supabase Auth to create users.
 * - Insert into a separate `users` / `patients` model with hard-coded values.
 *
 * That conflicted with the chosen architecture:
 * - NextAuth + Prisma is the primary identity system.
 * - Supabase is used as the managed Postgres engine (and optional services),
 *   not as a second, divergent auth provider.
 *
 * To prevent split-brain identity issues, this file is now a thin placeholder.
 * All real signup/identity creation should go through:
 * - NextAuth flows configured in `src/server/auth/*`
 * - Prisma models aligned with `clinic.users` / `clinic.patients` tables.
 *
 * Future work (Phase 2 of remediation plan):
 * - Implement a NextAuth-based signup/registration flow that:
 *   - Creates a NextAuth/Prisma user.
 *   - Writes a corresponding record into `clinic.users`.
 *   - Optionally creates `clinic.patients` rows for patient signups.
 * - Ensure that `ctx.session.user.id` maps 1:1 to `clinic.users.id`.
 *
 * For now, we expose a no-op that clearly communicates the required path.
 */

import { patientRegistrationSchema } from "@/types/zod-schemas";

export async function signup(formData: unknown) {
  const parsed = patientRegistrationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data.", details: parsed.error.flatten() };
  }

  // This is intentionally not creating users directly.
  // Use NextAuth-based flows + Prisma + clinic.users/clinic.patients instead.

  return {
    error: null,
    success: false,
    message:
      "Direct Supabase-based signup is disabled. Use the NextAuth/Prisma signup flow aligned with clinic.users/clinic.patients.",
  };
}
