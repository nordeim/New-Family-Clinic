Executive summary

Short answer: Yes, you can run a local Supabase-compatible Postgres using the official `supabase/postgres` image (including `supabase/postgres:17.6.1.044`) to support your existing `db:run-migrations` and `db:run-seeds` workflow—provided you configure it correctly. This is a sound, minimal-impact approach that fits your current architecture, but there are important nuances around:

- Which tag/version to use.
- How Supabase-specific extensions/settings behave locally.
- How to wire `DATABASE_URL` and `app.environment`.
- How this compares to using the full local Supabase stack (`supabase start`) vs just the Postgres container.

Below is a meticulous deep-dive and then concrete, copy-pastable recommendations.

1. Deep-dive: Is using `supabase/postgres:17.6.1.044` viable for your use case?

Your goals and constraints:

- Goal:
  - Run your existing SQL migrations and seeds against:
    - Local Postgres for development
    - Remote Supabase (managed Postgres)
  - Using your current runners:
    - `scripts/run-migrations.js`
    - `scripts/run-seeds.js`
- Constraints:
  - No new migration framework.
  - Minimal-impact changes.
  - Environment-agnostic:
    - Same SQL should run against:
      - Local dev DB
      - Supabase project DB
  - Maintain current semantics:
    - `001_system_seed.sql`: prod-safe, always OK.
    - `002_dev_seed.sql`: only for dev/test environments (guarded within SQL).

Key question

Can a local container pulled via:

- `docker pull supabase/postgres:17.6.1.044`

serve as your local database target (via `DATABASE_URL`) so that:

- `npm run db:run-migrations`
- `npm run db:run-seeds`

run cleanly, and the resulting schema is compatible with a real Supabase-hosted Postgres?

Short technical answer

- Yes, if:
  - You use a tag that aligns with your Supabase Postgres version/stack.
  - You configure the container’s environment variables appropriately.
  - Your migrations:
    - Either do not depend on Supabase runtime services (auth, storage, triggers), or
    - Handle their absence gracefully when running on a plain-ish Postgres (even with Supabase’s extension set).
- The `supabase/postgres` image is precisely intended to emulate the Supabase Postgres environment locally:
  - Includes required extensions (e.g., `pgcrypto`, `pgjwt`, `pg_stat_statements`, often `pg_net`, etc., depending on tag).
  - Includes config alignments Supabase expects.
- For your specific pipeline:
  - You are already using pure SQL migrations and seeds.
  - Your connection is configured via `DATABASE_URL`.
  - Your seeds distinguish between system vs dev data based on environment guards.
  - This fits perfectly with using a local Supabase-flavored Postgres as a drop-in replacement for your remote instance.

2. Important nuances and constraints (what you must verify)

When using `supabase/postgres:17.6.1.044`:

- Version alignment:
  - Ensure the tag you use matches (or is compatible with) the Supabase Postgres version your production project is running.
  - Supabase frequently aligns images with their platform stack; mismatches might cause:
    - Missing or extra extensions.
    - Behavior differences in SQL features.
  - Action:
    - In your Supabase project dashboard, check the Postgres version.
    - On Docker Hub (`supabase/postgres`), confirm:
      - `17.6.1.044` is a stable, documented tag.
      - It is not deprecated or marked as internal/experimental.
    - If there’s a clearly recommended tag (e.g., `15.1.0.123` style for your stack), prefer that.

- Supabase extensions and features:
  - Pros of `supabase/postgres` vs vanilla `postgres`:
    - You get Supabase-specific extension support baked in.
    - Reduces “works locally, fails on Supabase” risk.
  - For your pipeline:
    - If your migrations use:
      - `pgcrypto`, `uuid-ossp`, `pgjwt`, `pg_net`, `http`, or similar:
        - `supabase/postgres` is safer than bare `postgres`.
    - If your migrations are pure ANSI SQL and standard extensions:
        - Both `postgres` and `supabase/postgres` would work; but `supabase/postgres` still keeps you closer to prod.

- Supabase platform services:
  - The `supabase/postgres` image alone:
    - Does NOT run the full Supabase platform:
      - No auth server.
      - No storage API.
      - No edge functions.
    - It is Postgres configured Supabase-style.
  - For your current requirements:
    - You only need:
      - Reliable schema and seed application.
      - Query behavior alignment.
    - Therefore:
      - You do NOT need the full `supabase start` stack just to validate migrations/seeds.
      - Using only `supabase/postgres` is a valid, minimal approach.

3. Concrete recommended setup with `supabase/postgres`

Here is a precise, low-friction local setup tailored to your pipeline.

A. Run the local Supabase Postgres container

Example:

```bash
docker run --name local-supabase-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  -d supabase/postgres:17.6.1.044
```

Notes:

- Pick a non-conflicting port (e.g., `54322`) if you already run local Postgres.
- Credentials:
  - Use simple, local-only credentials; you’ll mirror them in `DATABASE_URL`.

B. Configure `DATABASE_URL` for your existing scripts

In your `.env.local` (or `.env` depending on your dotenv setup):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
NODE_ENV=development
```

- This keeps your runners untouched: they already:
  - Use `DATABASE_URL`.
  - Use `dotenv/config`.

C. Run your existing pipeline

Run:

```bash
npm run db:run-migrations
npm run db:run-seeds
```

Behavior expectations:

- `scripts/run-migrations.js`:
  - Connects to `local-supabase-db`.
  - Executes `database/migrations/*.sql` in lexical order.
- `scripts/run-seeds.js`:
  - Executes `database/seeds/*.sql` in lexical order.
  - `001_system_seed.sql`: always safe.
  - `002_dev_seed.sql`: only runs fully if your `app.environment` guard passes.
    - Ensure whatever sets `app.environment` in your SQL environment is aligned (we can refine this if needed).

If all migrations/seeds succeed here:

- You have strong confidence they will also succeed against your remote Supabase project (modulo:

  - network connectivity
  - Supabase project-specific auth/storage policies, if any).

4. How this interacts with your remote Supabase project

Key design strength in your current setup:

- Single source of truth:
  - `DATABASE_URL` determines the target:
    - Local `supabase/postgres` container.
    - Remote Supabase DB (managed).
- Identical commands:

  - For local:
    - `DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres npm run db:run-migrations`
  - For remote Supabase:
    - `DATABASE_URL=postgres://postgres:<Secure_Passw0rd>@db.<project>.supabase.co:5432/postgres npm run db:run-migrations`

Because:

- Your runners:
  - Do not embed environment-specific logic.
  - Do not depend on local-only assumptions.
- Your SQL:
  - Uses `app.environment` guards appropriately.

This is exactly what we want: environment-agnostic, connection-string-driven behavior.

5. Risks, edge cases, and mitigations

Potential risks:

- Version/extension mismatch:
  - Risk:
    - Using a `supabase/postgres` tag that doesn’t match production’s stack may introduce subtle differences.
  - Mitigation:
    - Align the tag to Supabase’s documented version for your project.
    - If in doubt, we can pick the “closest official stable” tag indicated in Supabase docs.

- Over-reliance on Supabase-only features:
  - If your migrations start using Supabase-specific functions or metadata that assume the full stack:
    - They may behave differently on a bare `supabase/postgres` container.
  - Your current description suggests:
    - Mostly schema, tables, system settings, feature flags.
    - That’s safe.

- Environment guards (`app.environment`):
  - Ensure:
    - The way you set `app.environment` for local dev matches what your SQL expects.
  - If your guard uses something like:
    - `current_setting('app.environment', true)`, make sure:
      - You set it appropriately (e.g., via `ALTER DATABASE` or `ALTER ROLE` or at session start if needed).
  - If you’d like, I can propose a small, deterministic pattern for this that remains minimal-impact.

- Security / credentials:
  - Use clearly distinct credentials between:
    - Local containers
    - Remote Supabase
  - You’re already doing that logically; just keep `.env.local` scoped.

6. Validation procedure (to be confident this is correct)

I recommend this explicit validation flow:

1) Local container validation:

- Start `supabase/postgres:17.6.1.044`.
- Set `DATABASE_URL` to that container.
- Run:
  - `npm run db:run-migrations`
  - `npm run db:run-seeds`
- Check:
  - No migration errors.
  - No missing extensions.
  - `001_system_seed` data present.
  - `002_dev_seed` behavior matches expectations.

2) Remote Supabase validation (once network is available):

- Set `DATABASE_URL` to your Supabase project direct connection string.
- Run the same two commands from your actual dev machine (not this sandboxed environment).
- Confirm:
  - Same schema.
  - Same system seed data.
  - Dev seed only when allowed.

If both pass, your approach is production-grade, with minimal deltas between local and remote.

7. Recommendation and next steps

My recommendation:

- Yes: adopt `supabase/postgres` as your local dev DB image.
- Use it exactly as you’ve architected:
  - No new frameworks.
  - `DATABASE_URL`-selectable target.
  - Same `db:run-migrations` and `db:run-seeds` commands.
- Ensure:
  - Tag alignment with your Supabase project.
  - Clear docs for your team on:
    - How to run the local container.
    - How to set `DATABASE_URL`.
    - How dev vs prod seeds behave.

If you’d like, next I can:

- Draft a concise `docs/local-db.md` for your repo that:
  - Documents the `supabase/postgres`-based workflow.
  - Shows canonical `docker run` and `DATABASE_URL` examples.
  - Clarifies environment guard behavior for seeds.
- Review your `001_system_seed.sql` and `002_dev_seed.sql` patterns (based on snippets or descriptions) to make sure they are robust across both environments.
