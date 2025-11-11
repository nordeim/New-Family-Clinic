# AGENT — Single Source of Truth for an AI Coding Agent

Purpose: Provide a compact, accurate, and actionable briefing so an AI coding agent (e.g., Claude Code, OpenAI Codex) can start contributing to Gabriel Family Clinic v2.0 with minimal human supervision.

Date: 2025-11-09  
Prepared by: GitHub Copilot

---

## 1) Project overview (one-paragraph)
Gabriel Family Clinic v2.0 is a Next.js TypeScript full-stack application that uses:
- NextAuth + Prisma as the primary identity and session system
- Supabase-hosted Postgres (with SQL migrations, RLS, and functions) as the core database
- tRPC for a type-safe API
- Mantine + Tailwind for UI
- Stripe/Twilio/Resend for payments and notifications
It follows repository + service patterns, uses Zod for validation, has database migrations/seeds, and targets elderly-friendly UX, security/compliance (PDPA & MOH), and maintainability.

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
- Auth & identity (CRITICAL, UPDATED 2025-11-11):
  - NextAuth + Prisma is the SINGLE source of truth for application identity and sessions.
  - Supabase is used as the managed Postgres engine (and optional storage/realtime), not as a separate auth system.
  - All domain tables that reference a user (e.g. clinic.users, clinic.patients, clinic.doctors, payments, telemedicine_sessions, user_feedback) MUST ultimately link back to the NextAuth/Prisma user id (directly or via a well-defined mapping), not an independent Supabase Auth identity.

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