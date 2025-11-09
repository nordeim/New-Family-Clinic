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

Select an action (stage files / inventory / create bootstrap script / run tests).// filepath: /home/project/Gabriel-Family-Clinic-v2/AGENT.md

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