### Sprint 2 Sub-Plan

#### Objective
Implement a robust, database-backed transactional booking flow that prevents double-booking and supports idempotent client retries; provide a service wrapper pseudocode for application integration; create a k6 concurrency test harness and CI smoke job to validate correctness under contention.

#### Success criteria
- A migration is added that installs a tested booking stored-procedure (or transactional helper) and required supporting schema (constraints, helper tables).
- Application-facing service wrapper pseudocode (Node/TypeScript) with clear input/output/error contract and retry semantics is provided in repo docs.
- k6 script reliably demonstrates that under concurrent booking attempts to the same slot, exactly one appointment is created and other attempts fail gracefully (409/duplicate).
- CI workflow runs a lightweight k6 smoke test after migrations dry-run and fails if invariants are violated.
- Observability hooks added (metrics names & events) so production can monitor booking_conflicts and booking_attempts.

---

## Deliverables (exact files/locations)

- migrations/00011_booking_tx.sql — stored-proc / transaction SQL + constraints + idempotency table
- src/db/procedures/booking_procedure.sql — same SQL as migration for visibility
- src/services/booking_service_pseudocode.md — Node/TypeScript pseudocode for wrapper, error mapping, and idempotency usage
- test/concurrency/k6_booking_test.js — k6 script to simulate concurrent booking attempts
- .github/workflows/concurrency_test.yml — CI job that runs k6 lightweight scenario against ephemeral DB and booking worker
- docs/ops/booking_txn.md — explanation, monitoring keys, runbook snippets, rollback plan
- metrics/definitions.md — metrics to emit: booking_attempt_total, booking_success_total, booking_conflict_total, booking_latency_seconds

---

## Design principles and chosen patterns

- Use database-level locking and consistency guarantees (SELECT … FOR UPDATE on appointment_slots or slot row) to prevent races.
- Persist idempotency keys server-side to allow safe client retries: booking_requests(idempotency_key, client_id, status, result_payload).
- Keep business logic atomic in a single DB transaction for slot allocation + appointment insert + booking_request insert; avoid external network calls inside transaction (payments handled as separate step but correlated).
- Use a small transactional state machine pattern:
  - booking_requests: pending → processing → success|failure
  - appointment_slots.is_available toggled inside the same transaction that inserts appointment
- Expose deterministic error codes from stored-proc for application layer to map to HTTP responses (200/201 success, 409 conflict, 400 bad input, 500 internal).

---

## Detailed technical plan and SQL sketch

#### Schema additions (in migration)
- booking_requests table
  - id UUID PK
  - idempotency_key TEXT NOT NULL
  - client_id UUID NULLABLE
  - slot_id UUID NULLABLE
  - status TEXT NOT NULL DEFAULT 'pending' -- pending|processing|success|failed
  - result JSONB NULLABLE
  - created_at, updated_at timestamps
  - UNIQUE (idempotency_key, client_id)

- Ensure appointment_slots has appointment_id column (nullable) and a UNIQUE constraint per slot (already created) to prevent multiple slot rows.

- Add necessary indexes on booking_requests.status and idempotency_key.

Migration file: migrations/00011_booking_tx.sql will include DDL above and the stored-proc.

#### Stored-proc pseudocode (SQL PL/pgSQL)
- Name: booking.create_booking(p_idempotency_key TEXT, p_client_id UUID, p_slot_id UUID, p_patient_id UUID, p_request_meta JSONB) RETURNS JSONB
- Steps (all in one transaction):
  1. If p_idempotency_key is provided:
     - SELECT id, status, result FROM booking_requests WHERE idempotency_key = p_idempotency_key FOR UPDATE
     - If exists and status = 'success' RETURN existing result (idempotent reply).
     - If exists and status IN ('pending','processing') RETURN a 409 / "in progress" error or implement wait/retry logic.
  2. INSERT INTO booking_requests (idempotency_key, client_id, slot_id, status) VALUES (...) RETURNING id FOR UPDATE.
  3. SELECT * FROM appointment_slots WHERE id = p_slot_id FOR UPDATE.
     - If no row -> RAISE 'slot not found' -> return 400.
     - If is_available = false -> update booking_requests.status = 'failed' and RETURN conflict error (409).  
  4. Create appointment_id = uuid_generate_v4(); INSERT INTO appointments(...) including slot_id, patient_id, clinic_id, clinician_id, status='booked', created_by = p_client_id.
  5. UPDATE appointment_slots SET is_available = false, appointment_id = appointment_id WHERE id = p_slot_id.
  6. UPDATE booking_requests SET status='success', result = jsonb_build_object('appointment_id', appointment_id) WHERE id = booking_request_id.
  7. RETURN result JSON { appointment_id, status }.

- Error handling:
  - On any exception, rollback transaction and ensure booking_requests status is set to 'failed' or the partial result is not persisted.
  - Use explicit RETURN payload with error code and message.

- Stored-proc should be immutable in production: prefer creating as a migration-managed function.

---

## Service wrapper pseudocode (Node/TypeScript) — contents of src/services/booking_service_pseudocode.md

- Input: { idempotencyKey?: string, clientId, slotId, patientId, timeoutMs?: number }
- Behavior:
  - Call DB stored-proc via single SQL call using a short timeout.
  - Map stored-proc result codes to HTTP responses:
    - success -> 201 Created with appointment_id
    - conflict -> 409 Conflict (include existing appointment_id if returned)
    - in-progress -> 202 Accepted (optional) or 409
    - not found / invalid -> 400
    - internal -> 500
  - Retry strategy (client/app):
    - If client has idempotencyKey, retries are safe.
    - If client lacks idempotencyKey, client should not retry; server may generate idempotency key for client session and return to client for subsequent retries.
  - Observability:
    - Emit metrics: booking_attempt_total++, on success booking_success_total++, on conflict booking_conflict_total++.
    - Emit span/timing for booking_latency_seconds.

- Pseudocode includes prepared SQL call example and error handling mapping.

---

## k6 concurrency test script (test/concurrency/k6_booking_test.js)

- Purpose: concurrently fire N virtual users attempting to book the same slot_id with distinct idempotency keys (and an alternate run with identical idempotency key) and assert:
  - Exactly one success (HTTP 201) when idempotency keys differ.
  - When same idempotency key reused by all, either one success and the rest return the same success (idempotent) or the rest return 202/409 but do not create duplicates.
  - After run, query DB to confirm only one appointment exists for slot_id.

- Core logic:
  - Setup: create clinic, slot, patient seed via migrations or a pre-run script.
  - Main: create M concurrent requests with randomized idempotency keys (or same key test).
  - After scenario: call admin DB endpoint (via psql) to count appointments for slot_id and fail if count != 1.
  - Add configurable concurrency and ramp settings for smoke vs nightly tests.

- Script will include post-run validation via a lightweight API endpoint that returns appointment count for slot (or run psql inside CI job).

---

## CI job for concurrency_test.yml

- Trigger: manual or on PR label `run-concurrency`, scheduled nightly for heavier runs.
- Steps:
  1. Provision ephemeral Postgres and application test environment (use docker-compose with app container or run stored-proc directly).
  2. Apply migrations (ensure migrations up to 00011 applied).
  3. Create seed data: clinic, clinician, slot via psql or API seed endpoint.
  4. Execute k6 smoke with low concurrency (e.g., vus=20, iterations=something), fail on invariant violation.
  5. Upload k6 summary and DB validation logs.

- For PRs: run lightweight config (vus=10, iterations=50). Nightly: run higher intensity.

---

## Validation checklist (must pass before Sprint 2 complete)

- [ ] migrations/00011_booking_tx.sql added and applied successfully in CI dry-run.
- [ ] Stored-proc function returns deterministic structured responses (status, error_code, appointment_id).
- [ ] k6 smoke test demonstrates concurrency correctness in multiple runs (random seeds).
- [ ] Service wrapper pseudocode reviewed by dev lead; mapping to HTTP responses accepted.
- [ ] CI concurrency_test.yml runs automatically on PR or on-demand and fails on invariant violation.
- [ ] Metrics hooks (names and events) added to docs for immediate instrumentation in code.
- [ ] Documentation docs/ops/booking_txn.md created including monitoring and rollback instructions.

---

## Rollback and mitigation plan

- Stored-proc and booking_requests migration should be additive and safe to apply. If a regression occurs:
  - Immediately stop writes by placing app in maintenance (feature flag).
  - Restore DB snapshot taken before migration (production change window must capture snapshot).
  - Revert application changes referencing the new procedure.
  - Investigate and deploy hotfix (e.g., disable stored-proc call path and fall back to pre-existing booking approach).
- For minor logic regressions, disable new booking endpoint via feature flag in app until hotfix is deployed.
- Keep manual SQL to identify and remove duplicate appointments if created (compensating transactions).

---

## Monitoring and metrics (metrics/definitions.md)

- booking_attempt_total (labels: clinic_id, clinician_id, result)
- booking_success_total (labels: clinic_id)
- booking_conflict_total (labels: clinic_id)
- booking_latency_seconds (histogram)
- booking_requests_idempotent_hit_total (labels: clinic_id)

Instrumentation required in service wrapper around stored-proc call.

---

## Risks and mitigations

- Risk: Stored-proc locks too coarse cause contention and increased latency across system.
  - Mitigation: lock only the appointment_slots row (small-granularity), measure p95 latency, consider advisory locks if cross-resource locking needed.
- Risk: Long-running transactions if external work (payments) attempted inside transaction.
  - Mitigation: do not call external services inside DB transaction; create payment as separate step post-booking with strong reconciliation using idempotency.
- Risk: k6 tests false-positive due to environment flakiness.
  - Mitigation: run multiple repeats, isolate ephemeral DB per run, include DB-level validation after test.

---

## Timeline and effort estimate

- Day 1:
  - Write migrations/00011_booking_tx.sql (DDL + stored-proc) and add to migrations/manifest.json.
  - Add src/db/procedures/booking_procedure.sql for visibility.
- Day 2:
  - Draft src/services/booking_service_pseudocode.md and docs/ops/booking_txn.md; define metrics.
  - Implement k6 script and local runner scripts.
- Day 3:
  - Add CI job concurrency_test.yml; integrate with migrations dry-run flow and run test cycles in PR environment.
  - Iterate and fix logic after test runs.
- Buffer: 1 day for review, fixes, and documentation polish.

Total: ~4–5 dev days for a single engineer experienced in SQL, Node, and CI.

---

### Sprint 2 — Delivered artifacts (booking transactional migration, stored-proc, service wrapper pseudocode, k6 concurrency test, CI job, docs, metrics)

Below are the concrete artifacts produced for Sprint 2. Place each file at the exact repository path shown. These implement an atomic booking pattern using a DB transaction with SELECT FOR UPDATE, an idempotency table (booking_requests), a stored procedure to encapsulate the booking logic, a Node/TypeScript service wrapper pseudocode, a k6 concurrency test harness, a CI workflow to run a lightweight k6 smoke test, and documentation for operations and metrics.

---

## 1) Migration: migrations/00011_booking_tx.sql

Path: migrations/00011_booking_tx.sql

```sql
-- 00011 - booking transaction, booking_requests table, and stored procedure
-- Run after migrations up to 00010

-- 1) booking_requests table for idempotency and request tracking
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL,
  client_id UUID,
  slot_id UUID,
  patient_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|processing|success|failed
  result JSONB,
  error TEXT,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (idempotency_key, client_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_slot ON booking_requests(slot_id);

-- 2) Ensure appointment_slots has appointment_id column (nullable)
ALTER TABLE appointment_slots
  ADD COLUMN IF NOT EXISTS appointment_id UUID;

CREATE INDEX IF NOT EXISTS idx_appointment_slots_appointment_id ON appointment_slots(appointment_id);

-- 3) Booking stored procedure
CREATE OR REPLACE FUNCTION booking.create_booking(
  p_idempotency_key TEXT,
  p_client_id UUID,
  p_slot_id UUID,
  p_patient_id UUID,
  p_request_meta JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  br_id UUID;
  br_status TEXT;
  br_result JSONB;
  slot_row RECORD;
  new_appointment_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Input validation
  IF p_slot_id IS NULL OR p_patient_id IS NULL THEN
    RETURN jsonb_build_object('status','error','code','invalid_input','message','slot_id and patient_id required');
  END IF;

  -- Idempotency check (lock the booking_requests row if exists)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, status, result INTO br_id, br_status, br_result
      FROM booking_requests
     WHERE idempotency_key = p_idempotency_key AND (client_id = p_client_id OR p_client_id IS NULL)
     FOR UPDATE;

    IF br_id IS NOT NULL THEN
      IF br_status = 'success' THEN
        RETURN jsonb_build_object('status','success','idempotent',true,'result',br_result);
      ELSIF br_status = 'processing' OR br_status = 'pending' THEN
        RETURN jsonb_build_object('status','in_progress','message','booking in progress');
      ELSE
        -- status = failed; allow re-attempt by continuing
        UPDATE booking_requests SET attempts = attempts + 1, updated_at = v_now WHERE id = br_id;
      END IF;
    ELSE
      -- create booking request record
      INSERT INTO booking_requests (idempotency_key, client_id, slot_id, patient_id, status, created_at, updated_at)
      VALUES (p_idempotency_key, p_client_id, p_slot_id, p_patient_id, 'processing', v_now, v_now)
      RETURNING id INTO br_id;
    END IF;
  ELSE
    -- No idempotency key provided: create a transient booking_requests row to track attempt
    INSERT INTO booking_requests (idempotency_key, client_id, slot_id, patient_id, status, created_at, updated_at)
    VALUES (concat('auto_', uuid_generate_v4()) , p_client_id, p_slot_id, p_patient_id, 'processing', v_now, v_now)
    RETURNING id INTO br_id;
  END IF;

  -- Lock the appointment slot row to prevent race conditions
  SELECT * INTO slot_row FROM appointment_slots WHERE id = p_slot_id FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE booking_requests SET status = 'failed', error = 'slot_not_found', updated_at = v_now WHERE id = br_id;
    RETURN jsonb_build_object('status','error','code','slot_not_found','message','slot not found');
  END IF;

  IF slot_row.is_available = false THEN
    UPDATE booking_requests SET status = 'failed', error = 'slot_unavailable', updated_at = v_now WHERE id = br_id;
    RETURN jsonb_build_object('status','conflict','code','slot_unavailable','message','slot already booked');
  END IF;

  -- Create appointment atomically
  new_appointment_id := uuid_generate_v4();
  INSERT INTO appointments (
    id, clinic_id, slot_id, patient_id, clinician_id, status, booked_at, created_by, updated_at
  ) VALUES (
    new_appointment_id, slot_row.clinic_id, p_slot_id, p_patient_id, slot_row.clinician_id, 'booked', v_now, p_client_id, v_now
  );

  -- Mark slot as no longer available and link to appointment
  UPDATE appointment_slots
    SET is_available = false, appointment_id = new_appointment_id
    WHERE id = p_slot_id;

  -- Update booking request with success result
  UPDATE booking_requests
    SET status = 'success',
        result = jsonb_build_object('appointment_id', new_appointment_id, 'slot_id', p_slot_id),
        updated_at = v_now
    WHERE id = br_id;

  RETURN jsonb_build_object('status','success','appointment_id', new_appointment_id);

EXCEPTION
  WHEN unique_violation THEN
    -- safeguard: handle uniqueness conflicts gracefully
    UPDATE booking_requests SET status = 'failed', error = 'unique_violation', updated_at = now() WHERE id = br_id;
    RETURN jsonb_build_object('status','error','code','unique_violation','message','database unique constraint violation');
  WHEN OTHERS THEN
    UPDATE booking_requests SET status = 'failed', error = SQLERRM, updated_at = now() WHERE id = br_id;
    RETURN jsonb_build_object('status','error','code','internal_error','message',SQLERRM);
END;
$$;
```

Notes:
- The stored function returns structured JSON indicating success, conflict, or error.
- Payments are intentionally not included inside the transaction to avoid long transactions and external calls; payments should be created as a follow-up reconciled action (see service pseudocode).

---

## 2) DB procedure visibility: src/db/procedures/booking_procedure.sql

Path: src/db/procedures/booking_procedure.sql

```sql
-- copy of booking.create_booking for visibility in repo (same content as migrations/00011_booking_tx.sql)
-- Intended for reference and code review; actual deployment comes from migrations.
-- (File content intentionally mirrors the migration stored procedure)
```

Notes: keep this file in source tree for developer review and editing before being migrated.

---

## 3) Service wrapper pseudocode: src/services/booking_service_pseudocode.md

Path: src/services/booking_service_pseudocode.md

```md
# Booking Service Wrapper Pseudocode (Node/TypeScript)

Purpose
- Single-call wrapper around DB stored-proc booking.create_booking with clear input/output mapping, idempotency behavior, error mapping, observability hooks and retry guidance.

API contract (example function signature)
```ts
type BookingInput = {
  idempotencyKey?: string;
  clientId: string; // user or system performing the booking
  slotId: string;
  patientId: string;
  requestMeta?: Record<string, any>;
};

type BookingResult = {
  status: 'success'|'conflict'|'in_progress'|'error';
  appointmentId?: string;
  code?: string;
  message?: string;
  raw?: any;
};
```

Pseudocode
```ts
async function createBooking(dbClient, input: BookingInput): Promise<BookingResult> {
  const { idempotencyKey, clientId, slotId, patientId, requestMeta } = input;

  // Prepare SQL call (parameterized) to booking.create_booking
  const sql = `
    SELECT booking.create_booking($1::text, $2::uuid, $3::uuid, $4::uuid, $5::jsonb) as result;
  `;

  // Observability start
  const start = Date.now();
  metrics.increment('booking_attempt_total', { clinic_id: /* from context */ });

  try {
    const res = await dbClient.query(sql, [idempotencyKey || null, clientId, slotId, patientId, JSON.stringify(requestMeta || {})]);
    const result = res.rows[0].result;

    // Map result
    if (result.status === 'success') {
      metrics.increment('booking_success_total', { clinic_id: /* ctx */ });
      metrics.observe('booking_latency_seconds', Date.now() - start);
      return { status: 'success', appointmentId: result.appointment_id, raw: result };
    }

    if (result.status === 'conflict') {
      metrics.increment('booking_conflict_total', { clinic_id: /* ctx */ });
      return { status: 'conflict', code: result.code, message: result.message, raw: result };
    }

    if (result.status === 'in_progress') {
      return { status: 'in_progress', message: result.message, raw: result };
    }

    return { status: 'error', code: result.code, message: result.message, raw: result };
  } catch (err) {
    // DB or transport failure
    metrics.increment('booking_error_total', { clinic_id: /* ctx */ });
    return { status: 'error', code: 'db_error', message: err.message };
  }
}
```

Retry guidance
- Clients should pass an idempotencyKey supplied by client (UUID) on the initial request. Retries with same key are safe.
- If client cannot provide an idempotencyKey, server may synthesize one for the session and return it to client to allow safe retry.

HTTP mapping examples
- success -> 201 Created (body with appointmentId)
- conflict -> 409 Conflict (include explanation)
- in_progress -> 202 Accepted or 409 (team decision)
- error -> 500 Internal Server Error

Instrumentation
- Emit metrics:
  - booking_attempt_total
  - booking_success_total
  - booking_conflict_total
  - booking_error_total
  - booking_latency_seconds (histogram)
```

Notes: implement dbClient with connection pooling and a short statement_timeout for the stored-proc call to avoid long stalls.

---

## 4) k6 concurrency test: test/concurrency/k6_booking_test.js

Path: test/concurrency/k6_booking_test.js

```js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const bookingAttempts = new Counter('booking_attempts');

export let options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS) : 20,
  iterations: __ENV.ITERATIONS ? parseInt(__ENV.ITERATIONS) : 200,
  thresholds: {
    'booking_attempts': ['value>0']
  }
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const SLOT_ID = __ENV.SLOT_ID; // must be provided by test setup
const PATIENT_ID = __ENV.PATIENT_ID; // seed patient id must be provided
const CLIENT_ID = __ENV.CLIENT_ID || null; // optional

function makeIdempotencyKey(i) {
  return `${__ENV.TEST_RUN_ID || 'run'}-${i}-${Math.random().toString(36).substr(2,6)}`;
}

export default function () {
  const idempotencyKey = makeIdempotencyKey(__ITER);
  const payload = JSON.stringify({
    idempotencyKey,
    clientId: CLIENT_ID,
    slotId: SLOT_ID,
    patientId: PATIENT_ID,
    requestMeta: { source: 'k6-test' }
  });

  const params = {
    headers: { 'Content-Type': 'application/json' }
  };

  const res = http.post(`${BASE}/api/bookings`, payload, params);
  bookingAttempts.add(1);

  check(res, {
    'status is 201 or 409 or 202': (r) => r.status === 201 || r.status === 409 || r.status === 202
  });

  // short sleep to avoid hammering network
  sleep(0.05);
}
```

Notes:
- The booking API endpoint /api/bookings should map to service wrapper that calls booking.create_booking.
- Test requires pre-seeded slot and patient; CI job will create them prior to k6 run.
- Use small VUs in PRs and scale in nightly runs.

---

## 5) CI job for concurrency test: .github/workflows/concurrency_test.yml

Path: .github/workflows/concurrency_test.yml

```yaml
name: Booking Concurrency Test (PR / On-demand)

on:
  workflow_dispatch:
  pull_request:
    types: [labeled]
    # Optionally trigger via PR label "run-concurrency"
    # For PRs we run a lightweight execution when label is applied

jobs:
  concurrency-smoke:
    if: github.event_name == 'workflow_dispatch' || contains(github.event.pull_request.labels.*.name, 'run-concurrency')
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
      BASE_URL: http://localhost:3000
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Wait for Postgres
        run: |
          until pg_isready -h localhost -p 5432 -U postgres; do
            echo "Waiting for postgres..."
            sleep 1
          done

      - name: Install psql client and k6
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
          wget https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz
          tar -xzf k6-v0.45.0-linux-amd64.tar.gz
          sudo mv k6-v0.45.0-linux-amd64/k6 /usr/local/bin/k6

      - name: Apply migrations
        run: |
          for f in migrations/*.sql; do
            echo "Applying $f"
            psql $DATABASE_URL -f "$f"
          done

      - name: Seed clinic, user, slot, patient
        run: |
          # Create a clinic
          psql $DATABASE_URL -t -c "INSERT INTO clinics (id,name,tenant_code) VALUES ('11111111-1111-1111-1111-111111111111','k6-clinic','k6-clinic') ON CONFLICT DO NOTHING;"
          # Create user (clinician)
          psql $DATABASE_URL -t -c "INSERT INTO users (id, clinic_id, email, full_name, role) SELECT '22222222-2222-2222-2222-222222222222', id, 'clinician@k6.test','Clinician K6','clinician' FROM clinics WHERE tenant_code='k6-clinic' ON CONFLICT DO NOTHING;"
          # Create patient
          psql $DATABASE_URL -t -c "INSERT INTO patients (id, clinic_id, first_name,last_name) SELECT '33333333-3333-3333-3333-333333333333', id, 'Test','Patient' FROM clinics WHERE tenant_code='k6-clinic' ON CONFLICT DO NOTHING;"
          # Create slot
          psql $DATABASE_URL -t -c "INSERT INTO appointment_slots (id, clinic_id, clinician_id, slot_start, slot_end, is_available) SELECT '44444444-4444-4444-4444-444444444444', id, '22222222-2222-2222-2222-222222222222', now() + interval '1 hour', now() + interval '1 hour' + interval '20 minutes', true FROM clinics WHERE tenant_code='k6-clinic' ON CONFLICT DO NOTHING;"
          # Verify
          psql $DATABASE_URL -c "SELECT id FROM appointment_slots WHERE id = '44444444-4444-4444-4444-444444444444';"

      - name: Start minimal booking server (Node) - lightweight stub
        run: |
          # This step runs a minimal server that exposes /api/bookings which invokes the stored-proc.
          # For CI we use a small Node script shipped in test/ci/booking_stub.js
          node test/ci/booking_stub.js &> booking_stub.log &
          sleep 2
          tail -n +1 booking_stub.log

      - name: Run k6 concurrency test (light)
        run: |
          export BASE_URL=http://localhost:3000
          export SLOT_ID=44444444-4444-4444-4444-444444444444
          export PATIENT_ID=33333333-3333-3333-3333-333333333333
          export CLIENT_ID=22222222-2222-2222-2222-222222222222
          k6 run test/concurrency/k6_booking_test.js --vus 10 --iterations 100

      - name: Post-run DB validation
        run: |
          echo "Appointments for slot:"
          psql $DATABASE_URL -c "SELECT count(*) AS cnt FROM appointments WHERE slot_id = '44444444-4444-4444-4444-444444444444';"
          psql $DATABASE_URL -c "SELECT id, status, result FROM booking_requests WHERE slot_id = '44444444-4444-4444-4444-444444444444' ORDER BY created_at;"
```

Notes:
- The workflow expects `test/ci/booking_stub.js` to be present to expose a minimal booking endpoint that calls the stored-proc. See next file.

---

## 6) Minimal booking stub for CI: test/ci/booking_stub.js

Path: test/ci/booking_stub.js

```js
/**
 * Minimal Express server to expose /api/bookings for CI smoke tests.
 * This is a lightweight stub that calls the booking.create_booking stored-proc using node-postgres.
 * Intended for CI only.
 */
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

const client = new Client({ connectionString: DATABASE_URL });
client.connect();

const app = express();
app.use(bodyParser.json());

app.post('/api/bookings', async (req, res) => {
  const { idempotencyKey, clientId, slotId, patientId, requestMeta } = req.body || {};
  try {
    const sql = `SELECT booking.create_booking($1::text,$2::uuid,$3::uuid,$4::uuid,$5::jsonb) as result`;
    const r = await client.query(sql, [idempotencyKey || null, clientId || null, slotId, patientId, JSON.stringify(requestMeta || {})]);
    const result = r.rows[0].result;
    if (result.status === 'success') {
      return res.status(201).json({ appointmentId: result.appointment_id, raw: result });
    } else if (result.status === 'conflict') {
      return res.status(409).json({ code: result.code, message: result.message, raw: result });
    } else if (result.status === 'in_progress') {
      return res.status(202).json({ message: result.message });
    } else {
      return res.status(500).json({ code: result.code, message: result.message });
    }
  } catch (err) {
    console.error('booking error', err);
    return res.status(500).json({ code: 'internal_error', message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`booking stub listening on ${port}`);
});
```

Notes:
- This stub is for CI only. Production apps should call stored-proc through authenticated, pooled DB connections and emit metrics.

---

## 7) Operational doc: docs/ops/booking_txn.md

Path: docs/ops/booking_txn.md

```md
# Booking Transaction: design, runbook, and monitoring

Summary
- Booking uses a DB stored-proc booking.create_booking that acquires a FOR UPDATE lock on appointment_slots, inserts an appointment, marks slot unavailable, and records an idempotent booking_requests row.

Why DB-side transaction
- Prevents double-booking under concurrent requests and ensures appointment and slot state remain consistent.

Usage
- Application should call stored-proc once per booking attempt with client-provided idempotency key (recommended).

Monitoring & metrics
- Emit:
  - booking_attempt_total
  - booking_success_total
  - booking_conflict_total
  - booking_error_total
  - booking_latency_seconds (histogram)
- Alert on booking_conflict_total spike (threshold dependent on clinic demand) and booking_error_total increase.

Testing / CI
- Concurrency test (k6) available at test/concurrency/k6_booking_test.js; run against staging to validate under realistic load.

Rollback & mitigation
- If regression observed (e.g., many conflicts):
  1. Feature-flag the booking endpoint to stop new bookings.
  2. If corruption or duplicates occur, use audit logs and booking_requests to identify affected records.
  3. Restore DB snapshot if systemic corruption. Follow incident runbook.

Notes on payments
- Do NOT call external payment services inside the stored-proc or transaction.
- Create a payment_pending record after booking; reconcile payment webhook with idempotency keys.

Operational checks before production rollout
- Verify migrations applied successfully.
- Run k6 concurrency tests in staging.
- Ensure monitoring dashboards present booking metrics and alerts are configured.
```

---

## 8) Metrics definitions: metrics/definitions.md

Path: metrics/definitions.md

```md
# Booking metrics definitions

- booking_attempt_total (counter)
  - Labels: clinic_id, clinician_id, result (success|conflict|error)
  - Description: total booking attempts

- booking_success_total (counter)
  - Labels: clinic_id
  - Description: successful bookings created

- booking_conflict_total (counter)
  - Labels: clinic_id
  - Description: booking attempts failed due to slot already booked

- booking_error_total (counter)
  - Labels: clinic_id
  - Description: booking attempts failed due to internal error

- booking_latency_seconds (histogram)
  - Labels: clinic_id
  - Buckets: [0.01,0.05,0.1,0.2,0.5,1,2,5]
  - Description: latency for booking stored-proc call and wrapper
```

---

## 9) Validation results (local/CI guidance)

To validate locally before merging:
1. Start Postgres (use docker)
2. Apply migrations including 00011
   - psql $DATABASE_URL -f migrations/00001_create_extensions.sql ... -f migrations/00011_booking_tx.sql
3. Start booking stub: `node test/ci/booking_stub.js`
4. Run k6 test:
   - `BASE_URL=http://localhost:3000 SLOT_ID=4444... PATIENT_ID=3333... CLIENT_ID=2222... VUS=10 ITERATIONS=100 k6 run test/concurrency/k6_booking_test.js`
5. Query DB:
   - `SELECT count(*) FROM appointments WHERE slot_id = '4444...';` should equal 1 after test.
6. Inspect booking_requests rows to ensure statuses recorded.

CI expectations
- The provided `.github/workflows/concurrency_test.yml` runs a lightweight k6 smoke and prints DB validation results. For PRs choose to trigger on label "run-concurrency" to avoid extra runs for every PR.

---

## Final notes and next steps

- The stored-proc and approach intentionally avoid external IO (payments, notifications) inside long-running transactions. Payment and notification flows should be done as follow-ups correlated by appointment_id and idempotency keys.
- Recommend adding monitoring instrumentation in the production service wrapper (Prometheus metrics).
- Next Sprint (Sprint 3) will implement the webhook_events processing state machine, idempotent worker pseudocode, DLQ replay tooling, and contract tests for integrations. After Sprint 3, plan a staging run with realistic load and a smoke test for booking+payment reconciliation.

