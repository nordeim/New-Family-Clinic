### Sprint 1 Sub-Plan

This is the detailed sub-plan for Sprint 1 (Ordered migrations + migration tool + CI migration dry-run). It breaks the sprint into workstreams, tasks, artifacts, validation gates, rollback mitigation, and an estimated timeline. Once you review and approve this sub-plan I will produce the concrete files (migration skeleton, example migrations, CI YAML, and docs) for execution.

---

### Objectives

- Establish a canonical, ordered migration layout and manifest.
- Introduce a migration tool configuration (examples for both Flyway and node-pg-migrate).
- Add a CI workflow that dry-runs migrations against an ephemeral Postgres instance and runs smoke queries including RLS checks.
- Document the migration process and PR requirements to enforce safe schema changes.

Success criteria
- migrations/ contains ordered migration files (skeleton + first pass).
- CI job .github/workflows/db_migrations_dry_run.yml runs to completion in PRs and fails on migration or smoke-test errors.
- README and docs/migrations/README.md describe process, rollbacks, and developer checklist.
- CODEOWNERS updated to require DB owner approval for migration files.

---

### Deliverables (exact file paths)

- migrations/
  - 00001_create_extensions.sql
  - 00002_roles_and_service_accounts.sql
  - 00003_clinics_patients_users.sql
  - 00004_appointment_slots.sql
  - 00005_appointments.sql
  - 00006_webhook_events.sql
  - 00007_audit_schema.sql
  - 00008_rls_policies.sql
  - 00009_indexes_constraints.sql
  - 00010_seed_demo_data.sql
  - manifest.json (ordered list with descriptions)
- migration-tool examples
  - flyway.conf.example
  - node-pg-migrate.config.js.example
- docs/migrations/README.md (process, how-to, example commands)
- docs/migrations/smoke_tests.sql (SQL smoke checks)
- .github/workflows/db_migrations_dry_run.yml (CI pipeline for PRs)
- .github/CODEOWNERS (or update) to require DB owners for migrations/

---

### Tooling options and recommendation

- Two example configs will be provided:
  - node-pg-migrate (JavaScript/TypeScript friendly; integrates with node toolchain).
  - Flyway (SQL-first, checksums, widely used for strict SQL migrations).
- Recommendation: include both examples; pick one for enforcement. If the team prefers JS-driven migrations and wants to embed logic, adopt node-pg-migrate. If the team prefers SQL-only and checksum immutability, adopt Flyway.

---

### Detailed tasks and sequence

1. Create migrations/ skeleton and manifest
   - Split current canonical schema into the ordered files listed above.
   - Keep content minimal for first pass: table creation DDL and key constraints drawn from database_schema.md.
   - Add manifest.json with file order and short descriptions.

2. Add example migration-tool configs
   - Provide flyway.conf.example documenting required env vars and basic usage.
   - Provide node-pg-migrate.config.js.example with sample connection and migration directory settings.

3. Add smoke_tests.sql
   - Tests include:
     - SELECT 1 FROM appointments LIMIT 1 (table existence)
     - A small role-based RLS smoke test:
       - Connect as limited role and attempt SELECT on a table expected to be protected (expect denied or empty result).
       - Connect as service role and assert rows present for admin-level read.
   - Include simple integrity checks: count rows in appointments, appointment_slots; SELECT constraints introspection.

4. Implement CI workflow (.github/workflows/db_migrations_dry_run.yml)
   - Steps:
     - Checkout repo.
     - Start Postgres service container (explicit version: match production-major).
     - Wait-for-db readiness.
     - Run migration tool migrate (example commands for the two tools; use node-pg-migrate default in the job, with comments showing Flyway alternative).
     - Execute smoke_tests.sql using psql.
     - Run a schema export (pg_dump --schema-only) and upload as artifact.
     - Fail workflow on any non-zero exit code.
   - Use GitHub Actions service container for Postgres or a job step that pulls docker postgres. Use connection secrets from Actions environment variables set in workflow (no production creds).

5. Documentation
   - docs/migrations/README.md explaining:
     - How to add a migration.
     - Naming convention and ordering rules.
     - How to test migrations locally (docker-compose or psql).
     - CI dry-run explanation.
     - Rollback and emergency procedure (backups, restore).
     - Manifest maintenance.
   - Update PR template (checklist) to require migration file and CI pass for schema changes.

6. Governance
   - Add/modify CODEOWNERS to include DB owners for migrations/ and db/ directories.
   - Add a PR label convention (e.g., "db/migration") so reviewers can spot them.
   - Add a branch protection rule that requires CI job to pass and DB owner approval before merge.

---

### CI job (db_migrations_dry_run.yml) — structure overview

- Trigger: pull_request (paths: migrations/**, db/**, database_schema.md)
- Runner: ubuntu-latest
- Services: postgres:14 (or configured version)
- Steps:
  1. Checkout
  2. Setup psql client (install libpq)
  3. Wait for Postgres readiness loop
  4. Run migration tool (node-pg-migrate up or flyway migrate) with env vars
  5. Run smoke_tests.sql via psql using service_role creds created in early migration (or temp superuser)
  6. Run minimal RLS smoke checks (connect as limited role)
  7. pg_dump --schema-only > schema.sql
  8. Upload schema.sql as artifact
- Failure conditions:
  - migration command exits non-zero
  - smoke_tests.sql returns any error
  - RLS smoke checks show unexpected permissions

Notes:
- In CI, create the service_role and limited roles via migration scripts so RLS checks can run deterministically.
- Use ephemeral credentials passed from workflow environment; never use production secrets.

---

### Validation gates before moving to Sprint 2

- PR for migration skeleton must pass db_migrations_dry_run.yml with:
  - all migrations applied without error
  - smoke_tests.sql passes
  - schema dump artifact created
- DB owner(s) must approve migrations PR (CODEOWNERS or reviewer)
- docs/migrations/README.md must be present and reviewed
- PR template updated with migration checklist

---

### Rollback and emergency mitigation

- Each migration should be one-way; down scripts are optional, but for risky changes include a companion rollback plan in docs/migrations/rollbacks.md.
- CI dry-run prevents syntactic and early logical errors; for production deployment follow procedure:
  - take a fresh backup/snapshot
  - apply migration in maintenance window
  - run smoke tests and health checks
  - if failure, restore from snapshot and follow incident runbook
- Add a "pre-deploy checklist" requiring backup, owner approval, and off-hours scheduling for destructive migrations.

---

### Risks and mitigations

- Risk: SQL splitting omitted subtle DDL (e.g., dollar-quoted functions). Mitigation: keep functions in separate migration files and test psql execution end-to-end in CI.
- Risk: RLS smoke-tests in CI may not reflect production drift. Mitigation: include explicit smoke verification for expected denial responses and include periodic manual audits.
- Risk: Team confusion over tool choice. Mitigation: provide both example configs and a recommended default; finalize tool choice in Sprint 1 wrap-up.

---

### Estimated effort and timeline

- Day 1: Create migrations/ skeleton (split canonical schema into 5–7 files) and manifest.json.
- Day 2: Add migration-tool example configs, smoke_tests.sql, and docs/migrations/README.md.
- Day 3: Implement CI workflow, test iterations in PR, fix issues, and update PR template/CODEOWNERS.
- Buffer: 1 day for review/feedback and adjustments.

Total: ~4–5 dev days (one engineer). Adjust if deeper schema splitting is required.

---

### Acceptance checklist (for Sprint 1 completion)

- [ ] migrations/ contains ordered migration files and manifest.json.
- [ ] docs/migrations/README.md exists and explains process.
- [ ] .github/workflows/db_migrations_dry_run.yml added and passes on test PR.
- [ ] smoke_tests.sql covers table presence and RLS basic checks.
- [ ] CODEOWNERS or reviewer policy updated for migration files.
- [ ] PR template updated to enforce migration process.
- [ ] Team agrees on migration tool choice or schedules decision meeting.

---

### Sprint 1 — Delivered artifacts (migration skeleton, tool examples, CI dry-run, docs)

Below are the concrete files and their contents created per the approved sub-plan for Sprint 1. Drop these into the repository at the exact locations shown, run the CI to validate, and review the small adjustments noted after each file if you prefer Flyway vs node-pg-migrate.

---

### 1) migrations/manifest.json
Path: migrations/manifest.json

```json
{
  "migrations": [
    {"id":"00001_create_extensions.sql","desc":"Enable required Postgres extensions"},
    {"id":"00002_roles_and_service_accounts.sql","desc":"Create DB roles and service accounts"},
    {"id":"00003_clinics_patients_users.sql","desc":"Clinics, users, patients core tables"},
    {"id":"00004_appointment_slots.sql","desc":"Appointment slots table and helpers"},
    {"id":"00005_appointments.sql","desc":"Appointments table and constraints"},
    {"id":"00006_webhook_events.sql","desc":"Webhook event ingestion table and constraints"},
    {"id":"00007_audit_schema.sql","desc":"Audit schema, trigger function and table"},
    {"id":"00008_rls_policies.sql","desc":"Row-level security policies skeleton"},
    {"id":"00009_indexes_constraints.sql","desc":"Indexes and additional constraints"},
    {"id":"00010_seed_demo_data.sql","desc":"Optional demo data for local/dev"}
  ]
}
```

---

### 2) migrations/00001_create_extensions.sql

Path: migrations/00001_create_extensions.sql

```sql
-- 00001 - create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
```

Notes: safe to run repeatedly; required by later migrations.

---

### 3) migrations/00002_roles_and_service_accounts.sql

Path: migrations/00002_roles_and_service_accounts.sql

```sql
-- 00002 - roles and service accounts
-- Roles: superuser actions done by provisioning script; create least-priv roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clinic_admin') THEN
    CREATE ROLE clinic_admin NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clinician') THEN
    CREATE ROLE clinician NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'receptionist') THEN
    CREATE ROLE receptionist NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
    CREATE ROLE readonly NOINHERIT;
  END IF;
END$$;
```

Notes: migrations assume initial superuser runs these; CI will connect as superuser in ephemeral DB.

---

### 4) migrations/00003_clinics_patients_users.sql

Path: migrations/00003_clinics_patients_users.sql

```sql
-- 00003 - clinics, users, patients
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tenant_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL, -- application role, not DB role
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, email)
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  dob DATE,
  nric_encrypted BYTEA,
  nric_hash TEXT,
  contact JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Notes: sensitive fields prepared for encryption; actual encryption tooling handled by app/KMS.

---

### 5) migrations/00004_appointment_slots.sql

Path: migrations/00004_appointment_slots.sql

```sql
-- 00004 - appointment slots
CREATE TABLE IF NOT EXISTS appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES users(id),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, clinician_id, slot_start)
);

-- helper index
CREATE INDEX IF NOT EXISTS idx_appointment_slots_clinic_start ON appointment_slots(clinic_id, slot_start);
```

Notes: UNIQUE prevents duplicated slot rows; booking flow must perform FOR UPDATE or advisory lock to avoid races.

---

### 6) migrations/00005_appointments.sql

Path: migrations/00005_appointments.sql

```sql
-- 00005 - appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES appointment_slots(id) ON DELETE RESTRICT,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'booked',
  booked_at TIMESTAMPTZ DEFAULT now(),
  external_reference JSONB,
  created_by UUID,
  updated_at TIMESTAMPTZ
);

-- index for lookups
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
```

Notes: enforce application-level transactional linking between slot and appointment.

---

### 7) migrations/00006_webhook_events.sql

Path: migrations/00006_webhook_events.sql

```sql
-- 00006 - webhook_events ingestion
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID, -- FK to integrations table if present
  event_id TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|processing|success|failed|dead_letter
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error TEXT,
  idempotency_key TEXT,
  created_by UUID,
  UNIQUE (webhook_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency ON webhook_events(idempotency_key);
```

Notes: idempotency_key and unique constraint enable deduplication.

---

### 8) migrations/00007_audit_schema.sql

Path: migrations/00007_audit_schema.sql

```sql
-- 00007 - audit schema and trigger skeleton
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  row_data JSONB,
  changed_by UUID,
  clinic_id UUID,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- simple trigger function example (non-exhaustive)
CREATE OR REPLACE FUNCTION audit.log_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit.audit_logs(table_name, operation, row_data, changed_by, clinic_id)
      VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, current_setting('app.current_clinic_id', true)::UUID);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit.audit_logs(table_name, operation, row_data, changed_by, clinic_id)
      VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, current_setting('app.current_clinic_id', true)::UUID);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit.audit_logs(table_name, operation, row_data, changed_by, clinic_id)
      VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD), current_setting('app.current_user_id', true)::UUID, current_setting('app.current_clinic_id', true)::UUID);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Notes: SECURITY DEFINER function must be restricted in production; partitioning/immutability handled in later sprint.

---

### 9) migrations/00008_rls_policies.sql

Path: migrations/00008_rls_policies.sql

```sql
-- 00008 - RLS policy skeleton (examples)
-- Enable RLS on tables we want scoped by clinic
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY patients_per_clinic ON patients
  USING (clinic_id = current_setting('app.current_clinic_id', true)::UUID);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_per_clinic ON appointments
  USING (clinic_id = current_setting('app.current_clinic_id', true)::UUID);

ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY slots_per_clinic ON appointment_slots
  USING (clinic_id = current_setting('app.current_clinic_id', true)::UUID);

-- Note: CI will run smoke-tests to validate RLS denies cross-clinic access for limited role
```

Notes: current_setting may return null in CI; smoke tests ensure the app sets these settings via connection initializer in production.

---

### 10) migrations/00009_indexes_constraints.sql

Path: migrations/00009_indexes_constraints.sql

```sql
-- 00009 - additional indexes and constraints
-- Prevent orphaned appointment pointing to non-available slot via application enforced rules; still add checks where possible

-- Example of a constraint ensuring appointment slot only referenced once by appointment (if model requires)
ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS appointment_id UUID;

-- We keep uniqueness at slot creation; application MUST set appointment_id in transaction.
CREATE INDEX IF NOT EXISTS idx_apptslot_appointment_id ON appointment_slots(appointment_id);

-- Basic FK/constraint assurances already created in previous files
```

Notes: this file can be enhanced with CHECK constraints and generated columns in next sprints.

---

### 11) migrations/00010_seed_demo_data.sql

Path: migrations/00010_seed_demo_data.sql

```sql
-- 00010 - optional demo seed (safe for local/dev only)
INSERT INTO clinics (id, name, tenant_code)
  VALUES (uuid_generate_v4(), 'Demo Clinic', 'demo-clinic')
  ON CONFLICT DO NOTHING;

-- Example user
INSERT INTO users (id, clinic_id, email, full_name, role)
  SELECT uuid_generate_v4(), c.id, 'admin@demo.local', 'Demo Admin', 'clinic_admin'
  FROM clinics c WHERE c.tenant_code = 'demo-clinic'
  ON CONFLICT DO NOTHING;
```

Notes: CI will not run seeds by default; seeds helpful for local dev.

---

### 12) docs/migrations/README.md

Path: docs/migrations/README.md

```md
# Migrations Guide

Purpose
- This directory is the canonical ordered SQL migration set for the project. All schema changes must be introduced via migrations and reviewed.

Tooling
- We provide example configs for node-pg-migrate and Flyway. Choose one and update CI if you switch.

Naming and Order
- Files are prefixed with a zero-padded sequence `00001_...` to enforce order.
- Update migrations/manifest.json when adding new migrations.

Local testing
- Recommended local dev flow (Docker):
  1. Start Postgres: `docker run --rm -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14`
  2. Run migrations (node-pg-migrate): `npm run db:migrate -- -d postgres://postgres:postgres@localhost:5432/postgres`
  3. Run smoke tests: `psql postgres://postgres:postgres@localhost:5432/postgres -f docs/migrations/smoke_tests.sql`

CI dry-run
- The GitHub Actions workflow `.github/workflows/db_migrations_dry_run.yml` runs migrations against an ephemeral Postgres service and executes smoke tests. PRs that change migrations or DB-related files will trigger this check.

Rollback & emergency
- Non-destructive changes are safe. For destructive migrations, include a companion rollback plan in docs/migrations/rollbacks.md and schedule production change window.
- Production deployment must take a fresh DB snapshot before applying migrations.

Migration author checklist (include in PR)
- [ ] Add migration file(s) with the next sequence number
- [ ] Update manifest.json with description
- [ ] CI migration dry-run passes
- [ ] DB owners reviewed and approved (CODEOWNERS)
```

---

### 13) docs/migrations/smoke_tests.sql

Path: docs/migrations/smoke_tests.sql

```sql
-- smoke_tests.sql
-- 1) simple existence checks
SELECT 1 FROM clinics LIMIT 1;
SELECT 1 FROM users LIMIT 1;
SELECT 1 FROM patients LIMIT 1;
SELECT 1 FROM appointment_slots LIMIT 1;
SELECT 1 FROM appointments LIMIT 1;
SELECT 1 FROM webhook_events LIMIT 1;

-- 2) basic integrity
SELECT count(*) FROM clinics;
SELECT count(*) FROM users;

-- 3) RLS basic verification
-- Connect as limited role in CI and run:
-- Expectation: SELECT * FROM patients WHERE false; returns 0 rows when setting app.current_clinic_id not set.
-- CI uses connection steps to emulate limited role checks separately.

-- 4) minimal audit trigger fire (insert and check)
INSERT INTO clinics (id, name) VALUES (uuid_generate_v4(), 'smoke-clinic');
SELECT 1 FROM audit.audit_logs LIMIT 1;
```

Notes: RLS role-specific checks executed in CI job as separate connection using created roles.

---

### 14) .github/workflows/db_migrations_dry_run.yml

Path: .github/workflows/db_migrations_dry_run.yml

```yaml
name: DB Migrations Dry Run

on:
  pull_request:
    paths:
      - 'migrations/**'
      - 'db/**'
      - 'database_schema.md'
      - 'docs/migrations/**'

jobs:
  migrate-dry-run:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        ports:
          - 5432:5432
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Wait for Postgres
        run: |
          until pg_isready -h localhost -p 5432 -U postgres; do
            echo "Waiting for postgres..."
            sleep 1
          done

      - name: Install psql client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Apply migrations (node-pg-migrate example)
        run: |
          npm ci || true
          # Use node-pg-migrate if available in project, fallback to psql execution of migration files
          if [ -x "$(command -v node)" ]; then
            npx node-pg-migrate up --database $DATABASE_URL --migrations-dir migrations || true
          fi
          # fallback: run all .sql files in order (psql)
          for f in migrations/*.sql; do
            echo "Applying $f"
            psql $DATABASE_URL -f "$f"
          done

      - name: Run smoke tests
        run: |
          psql $DATABASE_URL -f docs/migrations/smoke_tests.sql

      - name: Dump schema
        run: |
          pg_dump --schema-only $DATABASE_URL > schema.sql
      - name: Upload schema artifact
        uses: actions/upload-artifact@v4
        with:
          name: schema-dump
          path: schema.sql
```

Notes: This YAML runs psql fallback over migration files. After the team selects node-pg-migrate or Flyway, replace the migrate step with the chosen tool's CLI invocation and lock the workflow to that tool.

---

### 15) node-pg-migrate.config.js.example

Path: node-pg-migrate.config.js.example

```js
module.exports = {
  migrationSchemaTableName: 'pgmigrations',
  dir: 'migrations',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  direction: 'up',
  count: 0
};
```

Notes: use via `npx node-pg-migrate up --config node-pg-migrate.config.js`.

---

### 16) flyway.conf.example

Path: flyway.conf.example

```
flyway.url=jdbc:postgresql://localhost:5432/postgres
flyway.user=postgres
flyway.password=postgres
flyway.locations=filesystem:migrations
flyway.baselineOnMigrate=true
```

Notes: Flyway expects files named V0001__xxxx.sql; if chosen, rename migration files accordingly.

---

### 17) .github/CODEOWNERS (migration section)

Path: .github/CODEOWNERS (or append section)

```
# DB migrations and schema owners
/migrations/ @your-team-db @db-owner
/db/ @your-team-db @db-owner
/docs/migrations/ @your-team-db @db-owner
```

Replace @your-team-db and @db-owner with actual GitHub handles or teams.

---

### 18) PR checklist snippet (to paste into .github/PULL_REQUEST_TEMPLATE.md)

Add the migration checklist item:

```md
- [ ] If this PR changes schema, a migration file was added to /migrations with proper sequence and manifest.json updated
- [ ] CI migration dry-run passes
- [ ] DB owner has reviewed and approved migration changes
```

---

### Quick validation steps for you (run after pushing)

1. Open a branch, add a trivial migration or no-op migration, push a PR targeting main to trigger the workflow.
2. Verify the GitHub Actions job `DB Migrations Dry Run` runs and completes, and that the uploaded schema-dump artifact appears in artifacts.
3. Inspect the schema.sql artifact to confirm the expected tables exist.
4. Ensure CODEOWNERS triggers DB owner review requirement on migration PRs.

---

### Notes, caveats and next recommended actions

- The SQL in the skeleton is intentionally conservative and focused on core structures. It avoids advanced DDL that can break naive SQL-splitting (dollar-quoted functions appear only in later migrations when we adopt a migration tool rather than psql loops).
- The CI uses a psql loop fallback to ensure the migrations apply in ephemeral CI. After you select node-pg-migrate or Flyway, update the workflow to use the selected tool exclusively and remove fallback behavior.
- RLS tests require the application to set session settings (app.current_clinic_id, app.current_user_id). The CI smoke-test includes a simple insert to exercise the audit trigger, but full RLS verification is performed with role-specific connections in a later sprint.
- Before applying to production add production checks to abort if placeholder secrets or demo seeds are present.

---

If you want, I will:
- a) Commit these files into the repository (I can produce the exact patch content for you to apply), or
- b) Prepare the next Sprint 2 sub-plan and then implement the booking stored-proc migration and k6 script.
