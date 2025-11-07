### Implementation plan overview

This plan sequences delivery of the three artifacts in a safe, testable order that minimizes blast radius and provides repeatable CI/validation gates. Each artifact deliverable includes: objectives, success criteria, detailed tasks (dev + infra + QA), concrete file/artefact names and locations, CI job definitions (YAML outline), validation steps, rollback strategy, and estimated effort. Work proceeds in three sprints delivered serially with validation gates before moving to the next artifact.

---

## Sprint order and rationale

1. Migrations framework and CI migration dry-run (Artifact 1) — establishes a canonical safe path for schema change and CI validation; required before schema changes for booking/webhooks.
2. Booking transactional stored-proc + service wrapper + concurrency test (Artifact 2) — implements DB-side atomic booking flow and proves it under contention using k6; depends on migrations infrastructure.
3. Webhook_events schema + idempotent worker + DLQ replay tooling (Artifact 3) — builds reliable integration processing using the migration system and proven operational patterns.

Each sprint contains a development phase, CI/infrastructure changes, automated tests, validation checklist, and documentation updates.

---

## Sprint 1 — Ordered migrations + migration tool + CI dry-run

Objective
- Replace monolithic schema deployment with an ordered migration set using a migration tool and a CI job that dry-runs migrations against an ephemeral DB, validates schema diffs, and verifies basic RLS/smoke queries.

Success criteria
- repository/migrations contains ordered, idempotent migration files.
- CI job executes migrations against ephemeral Postgres and runs smoke tests; job fails on errors.
- Developers follow migration process documented in repo.

Deliverables (files & locations)
- migrations/
  - 00001_create_extensions.sql
  - 00002_roles_and_service_accounts.sql
  - 00003_clinics_patients_users.sql
  - 00004_appointments_slots.sql
  - 00005_appointments.sql
  - 00006_webhook_events.sql
  - 00007_audit_schema.sql
  - 00008_rls_policies.sql
  - 00009_indexes_constraints.sql
  - 00010_seed_demo_data.sql
- migration-tool config
  - flyway.conf OR node-pg-migrate.config.js (chosen tool config)
- docs/migrations/README.md (process & release checklist)
- CI workflow
  - .github/workflows/db_migrations_dry_run.yml

Tool choice and rationale
- node-pg-migrate if team prefers JS/TypeScript migrations and seamless integration with existing toolchain; Flyway if strong SQL-first, checksum-based migrations are preferred. Plan will include both example config snippets; team picks one and we finalize.

Detailed tasks (developer + infra)
1. Create migrations/ directory and split existing database_schema.md into ordered SQL files following the migration sequence above.
2. Ensure each migration file is idempotent where possible or strictly ordered (do not re-run destructive migrations on reapply).
3. Add a migrations manifest (migrations/manifest.json) listing order and short description for human review.
4. Add a migration tool config (example for node-pg-migrate and Flyway included).
5. Implement CI workflow:
   - Provision ephemeral Postgres (use GitHub Actions service container or Testcontainers / docker-compose).
   - Run migrations against ephemeral DB.
   - Run smoke tests:
     - Verify presence of key tables (SELECT 1 FROM appointments LIMIT 1).
     - Validate RLS: open a connection as limited role and assert denied/allowed queries per policy.
   - Produce schema diff artifact (pg-diff or pg_dump pre/post) and fail on unexpected changes.
6. Document migration process in docs/migrations/README.md and add a PR checklist item requiring migration file(s) for schema changes.

CI job outline (db_migrations_dry_run.yml)
- Trigger: PR to main or migration files changed
- Steps:
  1. Checkout
  2. Spin up Postgres service container (specific version)
  3. Wait for DB availability
  4. Run migration-tool migrate against DB
  5. Run smoke SQL scripts (docs/migrations/smoke_tests.sql)
  6. Run pg_dump for schema export; compare to approved baseline if applicable
  7. Upload artifacts (schema dump, migration logs)
- Failure on: migration error, smoke-test failure, schema-diff policy violation

Validation checklist (before merge)
- [ ] All new migration files added to migrations/ with sequential names and descriptions.
- [ ] CI migration dry-run passes on PR.
- [ ] README migration process updated.
- [ ] CODEOWNERS requires DB schema owner approval for migration PR.

Rollback strategy
- Each migration must provide a clear down script in a companion file (optional depending on tool). In case of failed production migration, follow documented playbook: restore DB from latest consistent backup snapshot, revert application traffic to previous release, and open remediation ticket.

Estimated effort
- Split schema → migrations: 2–3 developer days.
- CI workflow + docs + QA: 1–2 days.

---

## Sprint 2 — Booking transactional stored-proc, service wrapper pseudocode, and k6 concurrency test

Objective
- Implement and validate a DB-backed, atomic booking flow that prevents double-booking under high concurrency and integrates with payment creation with idempotency support.

Success criteria
- Transactional stored-proc (or well-documented SQL transaction pattern) is in migrations and tested.
- Service wrapper pseudocode and example integration exist in repo; application team can adopt it.
- k6 script demonstrates concurrency correctness: under N concurrent booking attempts to same slot, exactly one succeeds and others fail gracefully.

Deliverables (files & locations)
- migrations/00011_booking_tx.sql — defines booking stored procedure (or transactional helper) and supporting indexes/constraints.
- src/db/procedures/booking_procedure.sql (if storing as SQL file)
- src/services/booking_service_pseudocode.md — service wrapper pseudocode and error handling contract
- test/concurrency/k6_booking_test.js — k6 script to simulate concurrent booking attempts
- CI job
  - .github/workflows/concurrency_test.yml — runs k6 against a staging infra or ephemeral environment in CI (lightweight) and asserts invariants
- docs/ops/booking_txn.md — explanation, usage examples, rollback and monitoring.

Design choices (high level)
- DB approach: implement SELECT FOR UPDATE on appointment_slots row (preferred) OR use advisory locks keyed by slot_id for cross-table locking.
- Enforce unique constraints: a UNIQUE constraint on appointment_slots (clinic_id, slot_time) or appointment slot id ensures DB-level uniqueness.
- Idempotency: accept an idempotency_key from client when initiating booking; persist in booking_requests table with unique(idempotency_key, client_id) to ensure retries don't create duplicates.
- Payment integration: payment record created as part of same transaction where possible (create payment_pending row) or create payment after booking but tie with idempotency key and transactional state machine to reconcile.

Booking stored-proc sketch (deliverable content)
- Inputs: p_slot_id UUID, p_patient_id UUID, p_requested_by UUID, p_idempotency_key TEXT, p_metadata JSONB
- Behavior:
  - BEGIN;
  - Check idempotency: SELECT status FROM booking_requests WHERE idempotency_key = p_idempotency_key FOR UPDATE; if exists return existing result.
  - SELECT * FROM appointment_slots WHERE id = p_slot_id FOR UPDATE;
  - If is_available = false EXIT with conflict.
  - INSERT booking_requests (idempotency key, pending)
  - INSERT appointments referencing slot
  - UPDATE appointment_slots SET is_available = false, appointment_id = new_appointment_id
  - Optionally create payment_pending record with unique payment_id; commit.
  - RETURN success + appointment id.
- Errors: any violation causes rollback and clear error codes returned for application to interpret (409 for conflict).

k6 concurrency test plan
- Script simulates M virtual users attempting to book the same slot concurrently using the booking API endpoint with different idempotency keys or same idempotency key scenarios.
- Assertions:
  - Exactly one successful booking for slot_id (verify via GET /api/appointments?slot_id)
  - All other requests return 409 Conflict or appropriate failure
  - No duplicate appointment entries in DB (post-run SQL validation)
- CI: run with low concurrency in PRs (smoke concurrency, e.g., 20 users) and larger runs as nightly test (100–1000 users) against staging.

Detailed tasks
1. Create migration file 00011_booking_tx.sql adding stored-proc and necessary constraints; update migrations manifest.
2. Add example application wrapper pseudocode with clear input/output/error mapping and examples for Node/TypeScript.
3. Add k6 test script and helper runner (dockerized k6 runner) to test/bench harness.
4. Update CI to run k6 smoke test against ephemeral environment after migration dry-run (concurrency_test.yml).
5. Add monitoring checks: expose metric for booking failures/attempts to detect contention in production.

Validation checklist
- [ ] Migration file applied successfully in CI dry-run.
- [ ] k6 test run shows exactly one success and rest conflict in multiple runs.
- [ ] Booking_service_pseudocode.md reviewed and accepted by dev lead.
- [ ] Instrumentation added to booking flow to record metrics (booking_attempts, booking_conflicts).

Rollback & mitigation
- If stored-procedure introduces regression, revert migration via down script or restore DB snapshot and roll back application. Ensure monitoring picks up booking failures.

Estimated effort
- Stored-proc + migration: 1–2 dev days.
- Pseudocode and docs: 0.5 day.
- k6 scripts + CI integration: 1 day.

---

## Sprint 3 — Webhook_events schema, idempotent worker, DLQ replay scripts

Objective
- Implement robust webhook ingestion and processing with idempotency, persistent state machine, DLQ, and replay tooling.

Success criteria
- webhook_events table with unique(event_id, webhook_id) exists in migrations.
- Worker pseudocode and sample implementation sketch exists.
- DLQ replay tooling able to reprocess dead-lettered events idempotently.
- Contract docs for primary integrations added.

Deliverables (files & locations)
- migrations/00006_webhook_events.sql (if not already present) or 00012_webhook_events_state_machine.sql — defines webhook_events table, indexes, and processing helper functions.
- src/workers/webhook_processor_pseudocode.md — idempotent processing worker pseudocode (with state transitions and error handling).
- tools/webhook_replay.sh — script to find dead-letter events and requeue them.
- docs/integrations/{stripe.md,whatsapp.md,daily.md,twilio.md} — minimal contract docs and recommendations for idempotency keys and signature verification.
- CI job
  - .github/workflows/webhook_contract_tests.yml — runs contract tests for each integration (mocked via webhook replays against worker in test harness)

Webhook_events schema (suggested columns)
- id UUID PK
- webhook_id UUID (foreign key to integrations table)
- event_id TEXT (provider event id)
- received_at TIMESTAMP with time zone DEFAULT now()
- payload JSONB
- signature TEXT
- status TEXT ENUM (pending, processing, success, failed, dead_letter)
- attempts INT DEFAULT 0
- last_attempt_at TIMESTAMP
- error TEXT
- processed_at TIMESTAMP
- idempotency_key TEXT (nullable) — for correlating retries
- UNIQUE (webhook_id, event_id)
- Index on status, attempts, processed_at

Worker design pattern (pseudocode highlights)
- Poll/consume pending events (status = pending) ordered by received_at, or use a push mechanism from DB LISTEN/NOTIFY or message queue mapped from webhook ingestion.
- For each event:
  - Attempt to transition row atomically from pending → processing (UPDATE WHERE id = X AND status = 'pending' RETURNING 1) to claim it.
  - Validate signature and schema.
  - Use idempotency logic: if event has idempotency_key and processing indicates duplicate (existing processed record), mark success and return.
  - Process business logic (e.g., handle stripe.payment_intent.succeeded → mark payment as complete) inside idempotent handlers.
  - On success: UPDATE status = success, processed_at, attempts++.
  - On recoverable failure: increment attempts, set last_attempt_at; if attempts exceed threshold, set status = dead_letter and enclose error.
- Use exponential backoff and jitter between retries.
- Worker must persist raw payload and error traces for forensic analysis.

DLQ replay tooling
- Script enumerates dead_letter rows, validates signature and payload, and re-inserts into webhook_events with new idempotency_key OR marks status back to pending but retains original event_id to ensure dedup protection.
- Replay must be admin-only operation with audit logging.

CI contract-test approach
- Mock provider sends signed events to a webhook ingestion test endpoint (local dev worker).
- Verify correct status transitions and idempotency by re-sending the same event_id twice and asserting single processing.
- Contract tests run in containerized environment and fail on behavior drift.

Detailed tasks
1. Add/verify webhook_events migration and unique constraint.
2. Add worker pseudocode docs and example TypeScript skeleton to show how to implement claims, state transitions, and error handling.
3. Add tools/webhook_replay.sh for operations to replay dead letters in a controlled manner.
4. Add integration docs for providers with recommended idempotency and signature patterns.
5. Add CI contract tests and include webhook replay tests.

Validation checklist
- [ ] Unique constraint prevents duplicate persisted event_id entries.
- [ ] Worker claim logic prevents concurrent double-processing of same row.
- [ ] Replaying the same event_id does not create duplicate business effects.
- [ ] DLQ replay script can re-process dead-letter rows idempotently.
- [ ] Contract tests pass in CI for each provider mock.

Rollback & mitigation
- If worker bug causes business duplication, use audit_log to identify affected operations and run compensating transactions or manual reversal procedures documented in runbooks.

Estimated effort
- Schema migration: 0.5–1 day.
- Worker pseudocode and skeleton: 1 day.
- Replay tooling and CI contract tests: 1–2 days.

---

## Cross-cutting CI/CD and governance requirements

- Enforce CODEOWNERS on migrations/ and db/ directories to require DB owner approvals.
- Add PR template checklist item: “Does this change include migration file(s) and CI dry-run pass?”
- Ensure sensitive environment variables used by CI (DB admin creds) are stored in secrets manager; never store real production secrets in CI.
- All migrations must be reviewed and tested on ephemeral DB in CI prior to merge.
- Maintain migration manifest and CHANGELOG for schema changes.

---

## Validation & acceptance criteria for the overall program

Before closing the program, the following must be demonstrated in an end-to-end runbook executed on a staging environment:

- Migration CI pipeline successfully applies all migrations to a pristine staging DB and smoke tests pass.
- Booking transactional stored-proc is exercised by k6 concurrency test with invariants satisfied (one success per slot).
- Webhook ingestion receives mocked provider events, processes them idempotently, and DLQ replay re-processes dead letters without duplication.
- Observability: metrics for booking_attempts, booking_conflicts, webhook_processing_rate, webhook_dead_letters are published and visible in monitoring dashboard.
- Runbook: documented steps for emergency rollback (DB restore), and manual DLQ operation tested.

---

## Next steps (I will execute after you approve the plan)

1. Create the migrations/ directory skeleton and produce the first draft of migration files (Sprint 1 deliverable).  
2. Produce the example CI YAML for migration dry-run and a smoke-test SQL script.  
3. Implement booking stored-proc migration and k6 test harness (Sprint 2).  
4. Implement webhook_events migration, worker pseudocode, and DLQ scripts (Sprint 3).  

If you want, I will start immediately on Sprint 1 and produce:
- A complete migrations/ skeleton with the first 5 migration SQL files and the CI dry-run YAML, plus docs/migrations/README.md.
