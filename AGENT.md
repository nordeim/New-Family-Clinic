# AGENT — Single Source of Truth for an AI Coding Agent

Purpose: Provide a compact, accurate, and actionable briefing so an AI coding agent (e.g., Claude Code, OpenAI Codex) can start contributing to Gabriel Family Clinic v2.0 with minimal human supervision.

Date: 2025-11-09  
Prepared by: GitHub Copilot

---

## 1) Project overview (one-paragraph)
Gabriel Family Clinic v2.0 is a Next.js 14.2 TypeScript full-stack application that uses:
- NextAuth + Prisma as the SINGLE source of truth for identity and sessions
- Supabase-hosted Postgres (with SQL migrations, RLS, and functions) as the core database engine (not auth)
- tRPC v11 for a type-safe API between frontend and backend
- Mantine + Tailwind for UI
- Stripe/Twilio/Resend/Daily as pluggable integrations for payments, notifications, and telemedicine
It follows repository + service patterns, uses Zod for validation, enforces strict ESLint/TS rules, and targets elderly-friendly UX plus strong PDPA/MOH-aligned security and maintainability.

---

## 2) Workspace layout & entry points (what to open first)
- Root files:
  - package.json
  - .env.example
  - README.md
  - AGENT.md
- Runtime source (Next.js 14 App + Pages):
  - src/app/
    - layout.tsx — root layout
    - page.tsx — primary landing page
    - api/auth/[...nextauth]/route.ts — NextAuth handler
    - api/trpc/[trpc]/route.ts — tRPC handler
  - pages/ (legacy Pages Router routes)
    - dashboard/*, admin/*, doctor/*, etc. — feature pages wired via tRPC and components
    - api/webhooks/stripe — Stripe webhook entrypoint
- Core libraries:
  - lib/trpc/ — tRPC client/server wiring and feature routers
  - lib/auth/ — NextAuth helpers and context
  - lib/integrations/ — Stripe, Twilio, Resend, Daily wrappers
  - lib/jobs/ — jobs queue types and processor backed by DB
  - lib/supabase/ — server-side Supabase clients (DB only)
  - types/ — shared domain and DB types (PaymentRecord, TelemedicineSessionRecord, JobRecord, etc.)
- Database:
  - database/migrations/ — SQL migrations (idempotent, ordered)
  - database/seeds/ — seed data for dev
- Tests:
  - tests/e2e/ — Playwright E2E specs
  - tests/server/ — Jest server-side test scaffolds (Jest config in jest.config.cjs)

Open order for onboarding:
1. README.md (dev setup)
2. src/lib/database/supabase-client.ts (db client)
3. src/lib/trpc/server.ts and pages/api/trpc handler
4. src/services/appointment-service.ts (example of repo->service flow)
5. src/pages/portal/appointments/book.tsx (example frontend -> tRPC usage)

---

## 3) Environment & how to run locally (must-have steps)
1. Copy env template:
   - cp .env.example .env.local
2. Populate `.env.local` with:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - APP_ENCRYPTION_KEY (openssl rand -base64 32)
   - AUTH_DISCORD_ID / AUTH_DISCORD_SECRET (or your chosen NextAuth providers)
   - Other third-party keys (Stripe/Twilio/Resend/Daily) as needed
   - Never expose server-side secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) to the client.
3. Install:
   - npm install
4. Migrate + seed (if using the SQL migrations/seeds flow in this repo):
   - npm run db:run-migrations
   - npm run db:run-seeds
5. Type-check, lint, test:
   - npm run type-check
   - npm run lint
   - npm test
6. Start dev server:
   - npm run dev (open http://localhost:3000)

Notes:
- Use a throwaway Supabase project for dev.
- If third-party keys are missing, code should run in mock mode; otherwise tests may need mocks.

---

## 4) Coding conventions & style
- TypeScript strict typing; use exported types in src/types/.
- File naming: PascalCase for components, camelCase for hooks, PascalCaseService for services.
- Validation: Zod schemas for inputs (client + server).
- Error handling: Throw AppError subclasses for operational errors; let global handler convert to API responses.
- Commit messages: Conventional Commits (feat:, fix:, docs:, chore:, etc.).
- Formatting: Prettier + ESLint — run npm run format:write and npm run lint before PR.

---

## 5) Architecture & patterns to follow when making changes
- Separation:
  - Controllers (Next.js route handlers, pages/api, tRPC routers) stay thin.
  - Business logic lives in service modules and lib/ helpers.
- Data access:
  - Prefer typed repositories / queries.
  - Supabase client is used strictly as a Postgres client from the server.
- Notifications:
  - Use integration wrappers (Twilio/Resend/etc.) behind a factory.
- Transactions:
  - For multi-step changes (e.g. booking + payment), use DB transactions or stored procedures.
- RLS & security:
  - Assume RLS is (or will be) enabled.
  - Design queries and functions to respect least-privilege and tenant/patient scoping.
- Auth & identity (CRITICAL, UPDATED 2025-11-11):
  - NextAuth + Prisma is the SINGLE source of truth for identity and sessions.
  - Supabase is:
    - Managed Postgres (clinic.*, booking.*, webhook.*, etc.)
    - Optional Storage/Realtime — NOT an auth authority.
  - All user-bound records (patients, doctors, payments, telemedicine_sessions, user_feedback, etc.)
    MUST ultimately reference the NextAuth/Prisma user id (directly or via a clear mapping).

---

## 6) Tests, CI & quality gates
- Jest:
  - Configured via [`jest.config.cjs`](jest.config.cjs:1) for `tests/server/**/*.test.ts`.
  - Focus: server-side logic, PDPA-safe tests (no real PHI).
- Playwright:
  - E2E tests under tests/e2e/ (`npm run test:e2e`).
- CI expectations:
  - Run: `npm run lint`, `npm run type-check`, `npm run test` (when suites mature).
  - Optionally run migrations/seeds against a test DB for integration coverage.
- External integrations:
  - Stripe/Twilio/Resend/Daily must be mocked in automated tests.

---

## 7) Common tasks & how to approach them (recipes)
- Add a new tRPC procedure:
  1. Add type definitions to src/types/.
  2. Create service method in src/services/.
  3. Add repository/db query in src/lib/database/queries/.
  4. Add tRPC router procedure in src/lib/trpc/routers/<feature>.ts with zod validation.
  5. Import router into root appRouter.
  6. Use api.<router>.<procedure>.useQuery/useMutation on frontend.

- Create DB migration:
  1. Add SQL file to database/migrations with timestamp prefix.
  2. Run npm run db:run-migrations.
  3. Add seed data if needed to database/seeds and run npm run db:run-seeds (dev only).

- Integrate an external provider safely:
  - Add provider wrapper in src/lib/integrations/ with explicit mock mode controlled by config or NODE_ENV.
  - Inject the provider into NotificationFactory; do not use global side-effects.

---

## 8) Security & PDPA-specific guidelines
- Do not log plaintext PHI (personal health information) or full NRIC in logs.
- Use APP_ENCRYPTION_KEY / encryption utilities for sensitive fields at rest.
- Follow least privilege: service_role key must never be used in client-side code.
- Ensure APIs that return personal data validate session and permissions (tRPC context -> req.user).
- Audit logging: capture operational events for user actions (create/update/delete) without logging sensitive payloads.

---

## 9) Developer ergonomics & debugging tips
- To inspect tRPC routes at runtime, open server logs in the Next.js API output or add structured logs with router names and procedure names (avoid leaking PII).
- For DB debugging, use Supabase SQL editor or connect via psql to DATABASE_URL.
- For local Stripe/Twilio webhooks, use ngrok or Tunnel to forward webhooks — but prefer mocking for CI.

---

## 10) PR expectations for the AI agent
- Keep PRs small and focused (single logical change).
- Include unit tests covering added/changed behavior.
- Update README or relevant docs for developer-facing changes (env, scripts).
- Ensure type-check and lint pass locally before opening PR.
- Provide a short PR description with: intent, changed files summary, test plan, and rollback notes.

---

## 11) Communication & escalation rules for the agent
- If an ambiguous requirement or missing file prevents progress, raise a single concise question referencing file/path and expected behavior.
- Do not make irreversible changes to infra or production configuration without human approval.
- When modifying security-sensitive code (auth, encryption, RBAC), require code owner sign-off.

---

## 12) Helpful commands (Linux)
- Install deps: npm install
- Type-check: npm run type-check
- Lint: npm run lint
- Format: npm run format:write
- Run dev server: npm run dev
- Migrate DB: npm run db:run-migrations
- Seed DB:
  - Standard: npm run db:run-seeds
    - Applies `database/seeds/001_system_seed.sql` (system config, safe/idempotent).
    - Designed to be safe in all environments.
  - DEV/TEST-ONLY demo data:
    - `database/seeds/002_dev_seed.sql` is for local/dev sample data only.
    - MUST NOT be run in production.
    - In environments with strict audit/partitioning on `audit.audit_logs`,
      run it via a dev-only wrapper that:
        - Temporarily disables triggers on `clinic.*` tables in that session,
        - Executes `002_dev_seed.sql`,
        - Re-enables those triggers.
- Run unit tests: npm test
- Run e2e tests: npm run test:e2e

---

## 13) Database & seeds guardrails (for AI agents & contributors)

When working with database schema and seeds:

- Migrations
  - All authoritative DDL is in `database/migrations/`.
  - Do not edit existing migration files; add new ones.
  - Do not weaken audit/partition constraints just to make seeds pass.
- Seeds
  - `001_system_seed.sql`:
    - System-level settings/flags.
    - Must be schema-aligned, idempotent, and safe across environments.
  - `002_dev_seed.sql`:
    - DEV/TEST ONLY demo data; enforced by environment guard.
    - Uses fixed timestamps; audit coverage for these rows is relaxed by design.
    - In audit-partitioned setups:
      - Run via an explicit dev-only script that disables/enables audit triggers
        (or all triggers) on `clinic.*` tables around the seed execution.
- Do
  - Keep seeds aligned with the current schema; use `ON CONFLICT` for idempotency.
  - Document any dev-only trigger/partition workarounds directly next to usage.
  - Ensure `npm run db:run-migrations` and `npm run db:run-seeds` remain green.
- Do NOT
  - Run `002_dev_seed.sql` in production or production-like CI.
  - Hide audit trigger disables in shared libraries or production runtime code.
  - Modify historical migrations as a shortcut for fixing seed issues.

---

## 13) Known unknowns / things to verify on first run
- Confirm:
  - Environment variables are set and validated by `src/env.js`.
  - Database migrations and seeds are aligned with current schema usage.
  - Jest and Playwright configs match team expectations.
  - Stripe/Twilio/Resend/Daily mock modes and secrets are wired correctly.

---
## 15) Auth & Identity — Single Source of Truth (UPDATED)

Decision:
- NextAuth + Prisma is the primary identity and session system.
- Supabase is used as:
  - Managed Postgres for the application schema (clinic.*, booking.*, webhook.*, etc.).
  - Optional provider for storage/realtime.
- Supabase Auth MUST NOT be used as a second, parallel identity system in this codebase.

Implications for contributors:
- DO:
  - Use NextAuth (src/server/auth/*) to authenticate users and obtain ctx.session.user in tRPC.
  - Treat ctx.session.user.id (NextAuth/Prisma user id) as the canonical user identifier.
  - Ensure relational tables reference this canonical id:
    - clinic.users.id
    - clinic.patients.user_id
    - clinic.doctors.user_id
    - user_feedback.user_id
    - payments.*, telemedicine_sessions.*, and other user-bound records.
  - Align Prisma models and SQL schema (clinic.users, clinic.patients, etc.) so they are consistent, or introduce a clear mapping layer.
  - Use Supabase (via DATABASE_URL, postgres client, or server-side libraries) strictly for database operations, respecting RLS and audit policies.

- DO NOT:
  - Introduce or rely on Supabase Auth-based signup/login flows that create independent user identities.
  - Write to ad-hoc public.users or divergent user tables that are not aligned with clinic.users / NextAuth/Prisma.
  - Hard-code clinic_id, NRIC values, or other sensitive identifiers in code; always:
    - Derive clinic_id from configuration or system_settings.
    - Use proper hashing/encryption utilities for NRIC and other PHI.
  - Bypass tRPC/NextAuth context for authorization in business logic.

Current status (as of latest remediation):
- NextAuth + Prisma:
  - Configured in src/server/auth/config.ts and src/server/auth/index.ts.
  - Drives tRPC context in src/server/api/trpc.ts.
- Supabase-auth signup helper:
  - lib/auth/actions.ts no longer creates Supabase Auth users or divergent profiles.
  - It is intentionally a documented placeholder to prevent split-brain identity.
- Future work:
  - Implement a cohesive NextAuth-based registration/onboarding flow that:
    - Creates a NextAuth/Prisma user.
    - Inserts corresponding records into clinic.users and clinic.patients.
  - Ensure all feature code (payments, telemedicine, feedback, booking, etc.) uses the canonical user id path consistently.

---

## 14) Final short checklist for first delivery cycle
- [x] Clone repo and run npm install
- [x] Create .env.local from .env.example (use dev Supabase)
- [x] Run `npm run build` (includes lint + type-check) — currently passes
- [ ] Run migrations and seeds (if using the full DB stack)
- [ ] Add incremental Jest coverage for critical routers and jobs
- [ ] Open small, focused PRs for further enhancements

---

If you want, I can now:
- Stage both files into the repository, or
- Perform an automated file-level inventory and produce a prioritized list of missing items and failing checks.

Select an action (stage files / inventory / create bootstrap script / run tests).// filepath: /home/project/Gabriel-Family-Clinic-v2/AGENT.md

---

## Notes — recent repo updates & current status (round 1)

- Date: 2025-11-09 (changes applied during troubleshooting round 1).
- Build: `next build` now completes successfully in this repository. The build step runs ESLint and TypeScript checks; remaining items are non-blocking lint warnings (mostly unused variable warnings) that are tracked for follow-up.
- NextAuth: The NextAuth handler now uses the typed `authConfig` from `src/server/auth/config.ts`. The API route file is at `src/app/api/auth/[...nextauth]/route.ts` and no longer uses `as any`.
- Pages: Two minimal redirect pages were added to satisfy Next.js page exports and avoid build-time page-collection errors:
   - `pages/admin/login.tsx` — client-side redirect to `/login`
   - `pages/doctor/login.tsx` — client-side redirect to `/login`
- Types & imports: Several modules were updated to use `import type` for type-only imports (notably `lib/auth/AuthContext.tsx`, `lib/integrations/resend.ts`, `lib/jobs/queue.ts`, `lib/notifications/types.ts`).
- Jobs typing: `lib/jobs/types.ts` now only exports types (no anonymous default export). `lib/jobs/queue.ts` imports those types with `import type`.
- Troubleshooting docs added:
   - `docs/troubleshooting/latest-build-error-review.md`
   - `docs/troubleshooting/build-fix-round-1-summary.md`
- Linting policy notes: the repository enforces several strict ESLint rules in CI and during `next build`:
   - `@typescript-eslint/no-explicit-any` (avoid `any` casts)
   - `@typescript-eslint/consistent-type-imports` (use `import type` for types)
   - `import/no-anonymous-default-export`
   - `@typescript-eslint/no-unused-vars` configured to allow names matching `/^_/u` (prefix unused vars with `_`)

If you want me to continue, I can (A) fix remaining `no-unused-vars` warnings in small batches, (B) prepare a PR with the round-1 fixes and docs, or (C) run a full file-level inventory and generate a prioritized TODO list. Tell me which and I'll proceed.

# AGENT — Single Source of Truth for an AI Coding Agent

Purpose: Provide a compact, accurate, and actionable briefing so an AI coding agent (e.g., Claude Code, OpenAI Codex) can start contributing to Gabriel Family Clinic v2.0 with minimal human supervision.

Date: 2025-11-09  
Prepared by: GitHub Copilot

---

## 1) Project overview (one-paragraph)
Gabriel Family Clinic v2.0 is a Next.js (Pages Router) TypeScript full-stack application that uses Supabase (Postgres, Auth, Storage, Realtime) for backend services, tRPC for a type-safe API, Mantine + Tailwind for UI, and Vercel for deployment. It follows repository + service patterns, uses Zod for validation, has database migrations/seeds, and integrates with Stripe/Twilio/Resend for payments and notifications. Primary goals: elderly-friendly UX, security/compliance (PDPA & MOH), and maintainability.

---

## 2) Workspace layout & entry points (what to open first)
- Root files: package.json, .env.example, docker-compose.yml, README.md
- Primary source: src/
  - src/pages/_app.tsx — app wrapper (providers)
  - src/pages/api/trpc/[...trpc].ts — tRPC handler (server entry)
  - src/lib/trpc/server.ts & src/lib/trpc/client.ts — tRPC server/client
  - src/lib/database/supabase-client.ts — Supabase client (DB access)
  - src/services/ — business logic services (appointment-service.ts, etc.)
  - src/components/ — UI components by feature
- Database: database/migrations/ and database/seeds/
- Tests: tests/ (unit/e2e references)

Open order for onboarding:
1. README.md (dev setup)
2. src/lib/database/supabase-client.ts (db client)
3. src/lib/trpc/server.ts and pages/api/trpc handler
4. src/services/appointment-service.ts (example of repo->service flow)
5. src/pages/portal/appointments/book.tsx (example frontend -> tRPC usage)

---

## 3) Environment & how to run locally (must-have steps)
1. Copy env template:
   - cp .env.example .env.local
2. Populate the following with a dev Supabase project:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - APP_ENCRYPTION_KEY (openssl rand -base64 32)
3. Install:
   - npm install
4. Migrate + seed:
   - npm run db:run-migrations
   - npm run db:run-seeds
5. Type-check, lint, test:
   - npm run type-check
   - npm run lint
   - npm test
6. Start dev server:
   - npm run dev (open http://localhost:3000)

Notes:
- Use a throwaway Supabase project for dev.
- If third-party keys are missing, code should run in mock mode; otherwise tests may need mocks.

---

## 4) Coding conventions & style
- TypeScript strict typing; use exported types in src/types/.
- File naming: PascalCase for components, camelCase for hooks, PascalCaseService for services.
- Validation: Zod schemas for inputs (client + server).
- Error handling: Throw AppError subclasses for operational errors; let global handler convert to API responses.
- Commit messages: Conventional Commits (feat:, fix:, docs:, chore:, etc.).
- Formatting: Prettier + ESLint — run npm run format:write and npm run lint before PR.

---

## 5) Architecture & patterns to follow when making changes
- Separation: Controllers (pages/api or tRPC routers) should be thin; business logic belongs in services.
- Data access: Use repositories (src/lib/database/queries or repository classes) for DB operations.
- Notifications: Use NotificationFactory to instantiate SMS/Email/WhatsApp providers.
- Transactions: For multi-step DB changes, use DB transactions where possible to preserve consistency.
- RLS & security: Assume Row-Level Security is enabled — ensure procedures use authenticated user context and least privilege.

---

## 6) Tests, CI & quality gates
- Run unit tests with npm test (Jest). E2E uses Playwright (npm run test:e2e).
- CI should run: type-check, lint, unit tests, and (optionally) integration tests against a test DB.
- Write unit tests for services and repository logic. Mock external integrations (Stripe/Twilio/Resend) using dependency injection.

---

## 7) Common tasks & how to approach them (recipes)
- Add a new tRPC procedure:
  1. Add type definitions to src/types/.
  2. Create service method in src/services/.
  3. Add repository/db query in src/lib/database/queries/.
  4. Add tRPC router procedure in src/lib/trpc/routers/<feature>.ts with zod validation.
  5. Import router into root appRouter.
  6. Use api.<router>.<procedure>.useQuery/useMutation on frontend.

- Create DB migration:
  1. Add SQL file to database/migrations with timestamp prefix.
  2. Run npm run db:run-migrations.
  3. Add seed data if needed to database/seeds and run npm run db:run-seeds (dev only).

- Integrate an external provider safely:
  - Add provider wrapper in src/lib/integrations/ with explicit mock mode controlled by config or NODE_ENV.
  - Inject the provider into NotificationFactory; do not use global side-effects.

---

## 8) Security & PDPA-specific guidelines
- Do not log plaintext PHI (personal health information) or full NRIC in logs.
- Use APP_ENCRYPTION_KEY / encryption utilities for sensitive fields at rest.
- Follow least privilege: service_role key must never be used in client-side code.
- Ensure APIs that return personal data validate session and permissions (tRPC context -> req.user).
- Audit logging: capture operational events for user actions (create/update/delete) without logging sensitive payloads.

---

## 9) Developer ergonomics & debugging tips
- To inspect tRPC routes at runtime, open server logs in the Next.js API output or add structured logs with router names and procedure names (avoid leaking PII).
- For DB debugging, use Supabase SQL editor or connect via psql to DATABASE_URL.
- For local Stripe/Twilio webhooks, use ngrok or Tunnel to forward webhooks — but prefer mocking for CI.

---

## 10) PR expectations for the AI agent
- Keep PRs small and focused (single logical change).
- Include unit tests covering added/changed behavior.
- Update README or relevant docs for developer-facing changes (env, scripts).
- Ensure type-check and lint pass locally before opening PR.
- Provide a short PR description with: intent, changed files summary, test plan, and rollback notes.

---

## 11) Communication & escalation rules for the agent
- If an ambiguous requirement or missing file prevents progress, raise a single concise question referencing file/path and expected behavior.
- Do not make irreversible changes to infra or production configuration without human approval.
- When modifying security-sensitive code (auth, encryption, RBAC), require code owner sign-off.

---

## 12) Helpful commands (Linux)
- Install deps: npm install
- Type-check: npm run type-check
- Lint: npm run lint
- Format: npm run format:write
- Run dev server: npm run dev
- Migrate DB: npm run db:run-migrations
- Seed DB: npm run db:run-seeds
- Run unit tests: npm test
- Run e2e tests: npm run test:e2e

---

## 13) Known unknowns (things the agent must check on first run)
- Confirm actual presence and paths of:
  - src/lib/trpc/server.ts and pages/api/trpc/[...trpc].ts
  - src/lib/database/supabase-client.ts (env variable names)
  - database/migrations and database/seeds content
  - package.json scripts match docs (db:run-migrations, db:run-seeds)
- Confirm whether mock mode flags exist for Stripe/Twilio/Resend.

---

## 14) Final short checklist for first delivery cycle
- [ ] Clone repo and run npm install
- [ ] Create .env.local from .env.example (use dev Supabase)
- [ ] Run type-check, lint and tests
- [ ] Run migrations and seeds
- [ ] Start dev server and verify homepage
- [ ] Open a small PR implementing one trivial fix or feature plus unit tests

---

If you want, I can now:
- Stage both files into the repository, or
- Perform an automated file-level inventory and produce a prioritized list of missing items and failing checks.

Select an action (stage files / inventory / create bootstrap script / run tests).