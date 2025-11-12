Executive summary

We’ll design a dedicated, self-contained `supabase/` local stack whose primary goal is:

- Mimic Supabase cloud behavior for:
  - Postgres schema, extensions, RLS, policies, and typical Supabase DB semantics.
- Optimize for:
  - Your existing SQL migrations/seeds pipeline (`db:run-migrations`, `db:run-seeds`) with `DATABASE_URL`.
  - Minimal-impact integration with your repo.
  - Clarity, maintainability, and safety (no hardcoded secrets).

We will:

1) Think deeply about the architecture options and trade-offs.
2) Define an implementation strategy focused on:
   - Supabase-flavored Postgres using `supabase/postgres`.
   - Optional supporting containers (pgadmin, adminer) as non-required tools.
3) Produce a rigorous, production-quality “Local Supabase DB Stack” guide.
4) Provide all necessary Docker-related files under `supabase/`:
   - `docker-compose.yml`
   - `.env.docker` (template)
   - `init-db.sh`
   - `wait-for-postgres.sh`
   - `README.md`-style guide contents
5) Validate the plan against your goals, then execute it.

Below is the full solution, organized as:

- A) Design and reasoning
- B) Validated implementation plan (checklist)
- C) Executed implementation: concrete files and guide

A) Design and reasoning (deep, but focused)

Goals (rephrased for precision)

- Provide a reliable local environment to:
  - Run your existing migrations and seeds unmodified.
  - Behave as close as practical to a Supabase-hosted Postgres instance.
- Requirements:
  - All configs/scripts live under `supabase/`.
  - Use `supabase/postgres` as the core DB image.
  - Do not hardcode secrets; use `.env.docker`.
  - Keep pipeline minimal and aligned:
    - `DATABASE_URL` remains the single switch for target DB
    - No new migration frameworks
- Scope:
  - “Mainly database use”:
    - We do NOT attempt to replicate all Supabase microservices.
    - We DO aim for:
      - Supabase-like Postgres version
      - Supabase-like extensions
      - Compatibility with Supabase-oriented SQL (RLS, policies, functions, etc.)

Key design choices

1) Use `supabase/postgres` as the primary service

- Why:
  - Closer fidelity to Supabase cloud than plain `postgres`.
  - Extensions and configurations aligned with Supabase expectations.
  - Perfect match for your “Supabase-managed Postgres” target model.
- Risk:
  - Supabase internals (e.g., `supautils`) exist, but for your use (single-tenant local dev), they are acceptable.
- Mitigation:
  - Document clearly that this is:
    - “Supabase-flavored Postgres for local dev”
    - Not a full Supabase stack.

2) Keep the stack lean by default

- Core mandatory component:
  - `supabase-db`: runs `supabase/postgres`.
- Optional helpers (only if you find them useful):
  - `db-gui`: e.g. Adminer or pgAdmin for inspection.
- No auth/storage/realtime containers:
  - Not needed for migrations/seeds.
  - Avoid complexity and confusion.

3) Explicit `.env.docker`

- Purpose:
  - Centralized control of:
    - Ports
    - DB user/password
    - Database name
  - No secrets in versioned YAML.
- Pattern:
  - Use safe defaults in the example, but mark them as “change locally”.
  - Let developers override via local-only changes.

4) Integration with existing Node migrations/seeds

- No changes required to your scripts.
- Workflow:
  - `cd supabase/ && docker compose up -d`
  - Set `DATABASE_URL` in your main project `.env.local` to match the local container.
  - Run:
    - `npm run db:run-migrations`
    - `npm run db:run-seeds`
- Ensures:
  - Same contract for local vs cloud.
  - Maximum reuse of your existing meticulous pipeline.

5) Health, readiness, and idempotency

- The `supabase-db` service:
  - Healthcheck (via `pg_isready`) to ensure readiness.
- Optional `wait-for-postgres.sh` for scripts if needed.
- We won’t auto-run your project migrations inside the container:
  - You keep explicit control from the host environment.
  - No hidden coupling or magic.

B) Validated implementation plan

Plan overview

We will create the following in `supabase/`:

1) `supabase/docker-compose.yml`
2) `supabase/.env.docker` (template)
3) `supabase/wait-for-postgres.sh`
4) `supabase/init-db.sh` (optional: for advanced workflows)
5) `supabase/README.md` (the deployment guide content you can paste into your docs)

Validation against requirements

- Uses official `supabase/postgres` image: [x]
- Located under `supabase/` sub-folder: [x]
- No hardcoded sensitive values (only env-driven): [x]
- Supports existing migration/seed runner with `DATABASE_URL`: [x]
- Minimal impact; no new frameworks: [x]
- Behavior: closely mimics Supabase DB, but clearly documented not a full Supabase: [x]
- Extensible for CI and team workflows: [x]

Now I’ll execute the plan and provide the concrete artifacts.

C) Executed implementation: full local Supabase DB stack

Note: All paths are relative to your repo root. All Docker-related assets live under `supabase/`.

1. `supabase/docker-compose.yml`

```yaml
version: "3.9"

services:
  supabase-db:
    image: ${SUPABASE_DB_IMAGE:-supabase/postgres:17.6.1.044}
    container_name: ${SUPABASE_DB_CONTAINER_NAME:-supabase-db-local}
    restart: unless-stopped
    environment:
      # Core Postgres configuration
      POSTGRES_USER: ${SUPABASE_DB_USER}
      POSTGRES_PASSWORD: ${SUPABASE_DB_PASSWORD}
      POSTGRES_DB: ${SUPABASE_DB_NAME}

      # Optional: Explicit PGDATA path inside container
      PGDATA: /var/lib/postgresql/data/pgdata

      # You can add Supabase/supautils related envs if required by specific image versions.
      # Keep them configurable via .env.docker, not hardcoded.

    ports:
      - "${SUPABASE_DB_PORT:-54322}:5432"

    volumes:
      - supabase_db_data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${SUPABASE_DB_USER} -d ${SUPABASE_DB_NAME} || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 10s

    # For isolated local network; can be extended to additional tools if needed
    networks:
      - supabase-local-net

  # Optional: Lightweight DB UI (Adminer)
  # Uncomment if your team wants a quick visual browser.
  # db-gui:
  #   image: adminer:latest
  #   container_name: supabase-db-adminer
  #   restart: unless-stopped
  #   depends_on:
  #     supabase-db:
  #       condition: service_healthy
  #   environment:
  #     # Adminer doesn't need secrets baked in; users input them via UI.
  #   ports:
  #     - "${SUPABASE_DB_ADMINER_PORT:-8080}:8080"
  #   networks:
  #     - supabase-local-net

networks:
  supabase-local-net:
    driver: bridge

volumes:
  supabase_db_data:
    driver: local
```

Key points:

- Uses `supabase/postgres:17.6.1.044` by default but allows override via `SUPABASE_DB_IMAGE`.
- No passwords or secrets hardcoded: all from `.env.docker`.
- Exposes host port `54322` by default to avoid conflicts (`localhost:54322`).
- Healthcheck ensures DB is ready before dependent services/tools start.

2. `supabase/.env.docker` (template)

Do NOT commit real secrets; treat this as a template. You can commit a sanitized version and let devs override locally.

```bash
# .env.docker
# Local Supabase-flavored Postgres configuration
# Copy this file to .env.docker (keep in supabase/) and adjust values as needed.
# Do NOT commit real passwords or secrets to version control.

# Image tag for local Supabase-like Postgres
SUPABASE_DB_IMAGE=supabase/postgres:17.6.1.044

# Container name
SUPABASE_DB_CONTAINER_NAME=supabase-db-local

# Database credentials (local only; choose strong but non-sensitive values)
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=change_this_local_password
SUPABASE_DB_NAME=postgres

# Host port to expose Postgres (maps to container 5432)
SUPABASE_DB_PORT=54322

# Optional: Adminer UI port (if db-gui service is enabled in docker-compose.yml)
SUPABASE_DB_ADMINER_PORT=8080
```

Developers:

- Run from `supabase/`:
  - `cp .env.docker .env.docker.local` (if you want a gitignored override pattern)
  - Or just edit `.env.docker` and keep `.gitignore` rules in place.

3. `supabase/wait-for-postgres.sh`

Utility script to block until Postgres is ready. Useful for CI or chained scripts. Not strictly required if you rely on healthchecks and manual commands, but included for robustness.

```bash
#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-54322}"
USER="${3:-postgres}"
DB="${4:-postgres}"
MAX_RETRIES="${5:-30}"
SLEEP_SECONDS="${6:-2}"

echo "Waiting for Postgres at $HOST:$PORT (db=$DB, user=$USER)..."

for i in $(seq 1 "$MAX_RETRIES"); do
  if PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; then
    echo "Postgres is ready."
    exit 0
  fi
  echo "[$i/$MAX_RETRIES] Postgres not ready yet, retrying in $SLEEP_SECONDS seconds..."
  sleep "$SLEEP_SECONDS"
done

echo "Postgres did not become ready in time."
exit 1
```

Notes:

- Intentionally reads `SUPABASE_DB_PASSWORD` from env when used.
- You can call this from CI scripts before running migrations.

4. `supabase/init-db.sh` (optional, carefully scoped)

We will keep this minimal and non-invasive. The main philosophy: migrations and seeds are run from your Node tooling, not hidden inside Docker.

Use this only if you want a one-liner “bring up DB and run migrations/seeds” for local dev convenience.

```bash
#!/usr/bin/env bash
set -euo pipefail

# This script is optional syntactic sugar to:
# 1) Start the local Supabase DB container
# 2) Wait until it's ready
# 3) Print the DATABASE_URL to use for your app / migration scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$SCRIPT_DIR"

if [ ! -f ".env.docker" ]; then
  echo "Error: .env.docker not found in $SCRIPT_DIR."
  echo "Create it from the template and set SUPABASE_DB_* values."
  exit 1
fi

echo "Starting local Supabase DB container..."
docker compose --env-file .env.docker up -d supabase-db

# Load env to extract values
set -o allexport
source .env.docker
set +o allexport

HOST="localhost"
PORT="${SUPABASE_DB_PORT:-54322}"
USER="${SUPABASE_DB_USER:-postgres}"
DB="${SUPABASE_DB_NAME:-postgres}"

echo "Waiting for Postgres to become ready..."
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}" \
  "${SCRIPT_DIR}/wait-for-postgres.sh" "$HOST" "$PORT" "$USER" "$DB"

DATABASE_URL="postgres://${USER}:${SUPABASE_DB_PASSWORD}@${HOST}:${PORT}/${DB}"

echo
echo "Local Supabase-like Postgres is ready."
echo "Use this DATABASE_URL in your main project:"
echo
echo "  DATABASE_URL=\"${DATABASE_URL}\""
echo
echo "Then run from project root:"
echo "  npm run db:run-migrations"
echo "  npm run db:run-seeds"
echo
```

Notes:

- Does not auto-run migrations/seeds to avoid magic.
- Prints the correct `DATABASE_URL` for developers to paste or export.
- Uses `.env.docker` as the single source of truth.

5. `supabase/README.md` (deployment/usage guide)

You can adapt this directly into your documentation.

```markdown
# Local Supabase Database Stack (`supabase/`)

Purpose:

- Provide a local Supabase-flavored PostgreSQL instance
- Mimic Supabase Cloud behavior primarily for:
  - Running existing SQL migrations (`db:run-migrations`)
  - Running existing seed scripts (`db:run-seeds`)
- Maintain:
  - Minimal impact on existing architecture
  - Environment-agnostic behavior via `DATABASE_URL`

This is NOT a full Supabase platform:
- No Auth, Storage, Realtime, or Edge Functions containers are included.
- It is focused on database-level parity and reliability.

## Directory Structure

All files live under `supabase/`:

- `docker-compose.yml`
- `.env.docker` (template; configure locally)
- `wait-for-postgres.sh`
- `init-db.sh` (optional helper)
- (This guide)

## 1. Setup Instructions

### 1.1. Create `.env.docker`

From `supabase/`:

```bash
cp .env.docker .env.docker.local  # Optional pattern
# or just edit .env.docker directly (ensure sensitive values are not committed)
```

Edit `.env.docker`:

- Set:
  - `SUPABASE_DB_USER`
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_DB_NAME`
  - `SUPABASE_DB_PORT` (default `54322` is usually safe)
- Do not use production secrets here. This is local-only.

Example (do NOT reuse in production):

```bash
SUPABASE_DB_IMAGE=supabase/postgres:17.6.1.044
SUPABASE_DB_CONTAINER_NAME=supabase-db-local
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=local_dev_password_change_me
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=54322
```

### 1.2. Start the Local Supabase DB

From `supabase/`:

```bash
docker compose --env-file .env.docker up -d supabase-db
```

Verify:

```bash
docker compose --env-file .env.docker ps
docker logs supabase-db-local --tail=50
```

or use the helper:

```bash
./init-db.sh
```

This will:

- Start `supabase-db`
- Wait for readiness
- Print a `DATABASE_URL` you can use in your main project.

## 2. Configure Your Application (`DATABASE_URL`)

In your main project root, set `DATABASE_URL` to point to this local DB.

For example, in `.env.local`:

```bash
DATABASE_URL="postgres://postgres:local_dev_password_change_me@localhost:54322/postgres"
NODE_ENV=development
```

Your existing scripts:

- `npm run db:run-migrations`
- `npm run db:run-seeds`

will now run against the local Supabase-flavored Postgres.

## 3. Running Migrations and Seeds

From project root (NOT `supabase/`):

```bash
npm run db:run-migrations
npm run db:run-seeds
```

Behavior:

- Uses `DATABASE_URL` from `.env.local`.
- Applies migrations and seeds to the `supabase-db` container.
- The same commands can later be run against a real Supabase project by changing only `DATABASE_URL`.

## 4. Optional: Database UI

If you enable the `db-gui` service in `docker-compose.yml`, you can:

- Visit: `http://localhost:${SUPABASE_DB_ADMINER_PORT:-8080}`
- Connect using:
  - System: PostgreSQL
  - Server: `supabase-db` (from within Docker network) or `host.docker.internal` / `localhost` with `SUPABASE_DB_PORT`
  - Username / Password / DB: from `.env.docker`

## 5. Stopping and Cleaning Up

Stop services:

```bash
cd supabase
docker compose --env-file .env.docker down
```

Remove volumes (DANGEROUS: deletes all local DB data):

```bash
cd supabase
docker compose --env-file .env.docker down -v
```

## 6. Notes and Best Practices

- This stack is for local development and testing:
  - Never expose it directly to the public internet.
  - Never reuse production credentials.
- For cloud Supabase:
  - Obtain `DATABASE_URL` from the Supabase dashboard.
  - Run the same `db:run-migrations` and `db:run-seeds` against that URL.
- Version alignment:
  - Periodically check Supabase docs for the Postgres version used by your project.
  - Update `SUPABASE_DB_IMAGE` in `.env.docker` accordingly.
- Extensions:
  - `supabase/postgres` includes most Supabase-required extensions.
  - If your migrations depend on specific extensions, validate via:
    - `SELECT * FROM pg_extension;`

This setup:
- Preserves your minimal, SQL-first, migration-driven architecture.
- Uses `DATABASE_URL` as the single abstraction.
- Provides a robust, repeatable local environment closely aligned with Supabase's managed Postgres.
```

Final validation checklist

- Uses official `supabase/postgres` image to mimic Supabase DB: [x]
- All Docker configs isolated under `supabase/`: [x]
- No hardcoded secrets; `.env.docker` controls sensitive values: [x]
- Supports your existing migration/seed runners without modification: [x]
- Clear, step-by-step guide included: [x]
- Addresses readiness, healthchecks, and team onboarding: [x]
- Explicit about scope: DB-focused, not full Supabase: [x]
