Identity and booking integration prerequisites have been reviewed; no changes applied yet in this step.

Summary of current state (validated against plan)

1) tRPC context
- File: [`src/server/api/trpc.ts`](src/server/api/trpc.ts:1)
- Behavior:
  - Uses NextAuth-based auth:
    - const session = await auth();
  - Context shape:
    - { db, session, headers }
  - Exposes:
    - publicProcedure (no auth required).
    - protectedProcedure (requires ctx.session.user).
- Implication:
  - tRPC currently trusts NextAuth session, not Supabase Auth.
  - For protected procedures, ctx.session.user.id is the canonical app-level user id.

2) NextAuth configuration
- File: [`src/server/auth/config.ts`](src/server/auth/config.ts:1)
- Behavior:
  - Uses PrismaAdapter(db) + DiscordProvider.
  - Session callback:
    - Attaches user.id from Prisma to session.user.id.
- Implication:
  - Canonical user id for tRPC (via NextAuth) is Prisma user id.
  - This is separate from Supabase Auth ids used in lib/auth/actions.ts.

3) NextAuth entrypoint
- File: [`src/server/auth/index.ts`](src/server/auth/index.ts:1)
- Behavior:
  - Wraps NextAuth(authConfig) and exports:
    - auth, handlers, signIn, signOut.
- This is consistent and not modified.

4) Supabase-based signup
- File: [`lib/auth/actions.ts`](lib/auth/actions.ts:1)
- Behavior:
  - Uses Supabase (createServerClient) for:
    - supabase.auth.signUp(...)
  - Then uses supabaseAdmin (also via createServerClient) to:
    - Insert into users table (public.users).
    - Insert into patients table with:
      - clinic_id: "your-default-clinic-uuid"
      - nric_hash: "..."
      - nric_encrypted: "..."
  - Issues:
    - Points to public.users, but canonical schema is clinic.users.
    - Uses placeholder clinic_id and NRIC handling.
    - Coexists with NextAuth+Prisma without a unifying identity story.

Validated conclusions

- There are effectively two parallel identity systems:
  - NextAuth + Prisma (driving tRPC ctx.session.user).
  - Supabase Auth + public.users/patients (per lib/auth/actions.ts).
- The booking flow we just wired (AppointmentService + appointment.router + booking page):
  - Currently does NOT assume a logged-in identity; it’s a public booking intent, which is acceptable for MVP.
  - Is unaffected by the identity split for now.
- For upcoming phases (unified identity, RLS alignment, secure flows like payments/telemedicine):
  - We must either:
    - Standardize on one auth source, or
    - Implement a clear mapping between NextAuth users and clinic.users (or Supabase users), and update lib/auth/actions.ts to match the schema (clinic.users, not public.users).

Why no edits applied in this step

- The user requested continued meticulous progression with the remediation plan.
- The next impactful, low-risk edits will target:
  - Correcting lib/auth/actions.ts to align with the actual schema (clinic.users / clinic.patients) and removing placeholders.
  - This should be done carefully as part of the Phase 2 “Identity & Profile Alignment” work.
- Before changing auth flows, it is critical to:
  - Have a precise understanding of the current split, which this step confirms.
  - Avoid partial edits that could break local experiments.

Next concrete step (to be executed next, not in this result)

- Implement a focused Phase 2 change:
  - Update [`lib/auth/actions.ts`](lib/auth/actions.ts:1) so that:
    - It inserts into clinic.users / clinic.patients (matching migrations) instead of public.users.
    - It uses a real default clinic_id derived from config / system_settings (or a well-documented constant).
    - It uses proper NRIC hashing/encryption placeholders aligned with the security guidelines (no plain "...").
  - Keep NextAuth+tRPC context behavior intact while making Supabase-based flows schema-correct.

This concludes the identity review step without code changes; the environment is ready for the next precise modifications in the remediation sequence.
