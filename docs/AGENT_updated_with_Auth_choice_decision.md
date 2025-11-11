AGENT.md has been updated to encode the finalized Auth decision and constraints as the single source of truth.

Key updates applied

1) Project overview corrected
- File: [`AGENT.md`](AGENT.md:10)
- Change:
  - Replaced prior description implying “Supabase Auth + Services” with:
    - NextAuth + Prisma as the primary identity/session system.
    - Supabase-hosted Postgres as the core database.
    - tRPC, Mantine, Tailwind, Stripe/Twilio/Resend unchanged.
- Effect:
  - New contributors immediately see the correct high-level architecture.

2) Architecture section extended with explicit Auth rules
- Section: “## 5) Architecture & patterns to follow when making changes”
- Added “Auth & identity (CRITICAL, UPDATED 2025-11-11)” guidelines:
  - DO:
    - Use NextAuth (src/server/auth/*) for authentication.
    - Treat ctx.session.user.id (NextAuth/Prisma) as canonical user id.
    - Ensure tables reference this id:
      - clinic.users.id
      - clinic.patients.user_id
      - clinic.doctors.user_id
      - user_feedback.user_id
      - payments.*, telemedicine_sessions.*, etc.
    - Align Prisma models and SQL schema or define a clear mapping layer.
    - Use Supabase strictly for DB (via DATABASE_URL / postgres client), with RLS/audit.
  - DO NOT:
    - Introduce Supabase Auth-based signup/login that creates independent identities.
    - Write to ad-hoc public.users or divergent tables not aligned with clinic.users.
    - Hard-code clinic_id, NRIC, or similar sensitive values; always derive & protect.
    - Bypass NextAuth/tRPC context for authorization.

3) New dedicated Auth & Identity section
- Section added: “## 15) Auth & Identity — Single Source of Truth (UPDATED)”
- Contents:
  - Restates decision:
    - NextAuth + Prisma = primary identity and session system.
    - Supabase = managed Postgres and optional storage/realtime, not parallel auth.
  - Reiterates DO / DO NOT lists (operationalized).
  - Documents current status:
    - NextAuth configured in:
      - src/server/auth/config.ts
      - src/server/auth/index.ts
    - tRPC ctx based on NextAuth in:
      - src/server/api/trpc.ts
    - Supabase-auth signup helper:
      - [`lib/auth/actions.ts`](lib/auth/actions.ts:1) now intentionally disabled as a divergent path and documented as such.
  - Future work (clearly scoped):
    - Implement cohesive NextAuth-based registration/onboarding flow that:
      - Creates NextAuth/Prisma user.
      - Inserts into clinic.users and clinic.patients with the same id.
    - Ensure all feature code (payments, telemedicine, feedback, booking, etc.) consistently uses this canonical id path.

Effect on contributors and future work

- Any AI or human contributor reading AGENT.md now has:
  - An unambiguous directive:
    - There is ONE identity system (NextAuth + Prisma).
    - Supabase Auth must not be (re)introduced as a second system.
  - Concrete to-dos:
    - Align Prisma and clinic.* schema.
    - Implement NextAuth-based onboarding that populates clinic.users/clinic.patients.
  - Concrete not-to-dos:
    - No new Supabase Auth flows.
    - No writing to misaligned user tables.
    - No hard-coded sensitive identifiers.

This documentation change is now in sync with:
- The implemented code changes in [`lib/auth/actions.ts`](lib/auth/actions.ts:1).
- The ongoing remediation plan in [`docs/master_remediation_plan.md`](docs/master_remediation_plan.md:1).

The Auth decision is fully codified as part of the project’s single source of truth, and subsequent remediation steps will build on this consistent foundation without ambiguity.
