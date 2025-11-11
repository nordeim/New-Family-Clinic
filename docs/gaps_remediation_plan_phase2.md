Phase 1 (booking pipeline) updates have been applied and validated for the first step, strictly following the master remediation plan.

Files updated

1) src/services/appointment-service.ts
- File: [`src/services/appointment-service.ts`](src/services/appointment-service.ts:1)

Key changes:
- Retained and documented stable contracts:
  - RequestBookingInput (name, phone, reason, preferredTime, contactPreference, idempotencyKey?).
  - RequestBookingResult now supports:
    - status: "received" | "success"
    - appointmentId?: string
    - appointmentNumber?: string
  - This anticipates future DB-backed booking without breaking current callers.

- Centralized orchestration:
  - AppointmentService is explicitly the single orchestration point for booking intents.
  - Future integration with:
    - booking_requests table
    - booking.create_booking() stored procedure
    - will occur here only.

- Validation behavior:
  - Enforces:
    - Non-empty name.
    - Valid SG phone (8 digits, starting 6/8/9).
    - Reason length >= 4.
    - Non-empty preferredTime.
    - contactPreference ∈ {"whatsapp","call","either"}.

- Idempotency:
  - Uses idempotencyKey (client-provided or generated).
  - In-memory Map<string, RequestBookingResult> ensures repeated calls with same key return same result.

- DB hook scaffolding (non-breaking):
  - Added createSqlClient() using DATABASE_URL with postgres.
  - In createBookingRequest:
    - After in-memory persistence, performs best-effort DB interaction inside try/finally:
      - Placeholder comment showing where an insert into a logging/booking_incoming_requests table or similar would go.
      - Swallows errors to avoid breaking UX in offline or sandboxed environments.
  - No direct calls to booking.create_booking yet, by design (blocked by network in this environment).

Checklist (from master_remediation_plan) — src/services/appointment-service.ts:
- [x] Public contract stable and documented.
- [x] Validation and normalization intact.
- [x] Idempotency enforced.
- [x] Single integration point for future DB/booking.create_booking wiring.
- [x] Optional Postgres client hook added; does not break runtime.
- [x] No stray "..." placeholders or schema violations introduced.

2) src/lib/trpc/routers/appointment.router.ts
- File: [`src/lib/trpc/routers/appointment.router.ts`](src/lib/trpc/routers/appointment.router.ts:1)

Key changes:
- Imports:
  - Now imports TRPCError from @trpc/server.
  - Uses createTRPCRouter and publicProcedure from server/api/trpc as before.

- requestBooking input schema:
  - Unchanged structurally; still matches the booking page UX.

- requestBooking mutation:
  - Still publicProcedure (MVP allows anonymous booking intents; can be tightened later if needed).
  - Delegates directly to AppointmentService.createBookingRequest(input).
  - Returns:
    - requestId
    - status
    - message
    - appointmentId (if present in future)
    - appointmentNumber (if present in future)

- Error handling:
  - Now maps failures to TRPCError with code "BAD_REQUEST":
    - Ensures consistent client-side behavior and avoids throwing raw Error.

Checklist — appointment.router.ts:
- [x] Continues to delegate to AppointmentService (single orchestration point).
- [x] Input validation via zod preserved.
- [x] Returns stable, UI-focused contract (plus optional appointmentId/appointmentNumber for future use).
- [x] Uses TRPCError for normalized error signaling.
- [x] No DB details leaked into router; consistent with architecture.

Notes on booking page

- File: [`src/app/booking/page.tsx`](src/app/booking/page.tsx:1)
  - Already:
    - Calls api.appointment.requestBooking.useMutation().
    - Sends fields that match requestBookingInput.
    - Uses an idempotencyKey per submission.
  - With the updated AppointmentService and router:
    - The page remains correct and benefits from:
      - Stronger backend orchestration.
      - TRPCError-based error signaling.
  - Next micro-step (later):
    - Update inline comments to reflect that requests now go through a real tRPC + AppointmentService pipeline (even while persistence is in-memory/DB-hooked).

Conclusion for this step

- Phase 1, step for backend booking endpoint refactor is complete:
  - AppointmentService and appointment.router are aligned with the master remediation plan.
  - No breaking changes to the booking page.
  - The code is ready for the next incremental enhancement: wiring AppointmentService to actual DB booking primitives once the execution environment allows.

Subsequent work (not executed here, per instructions)

- Next meticulous steps as per master_remediation_plan:
  - Extend AppointmentService’s DB branch to call booking.create_booking() with real clinic_id, slot_id, patient_id (when connectivity is available).
  - Introduce slot discovery APIs (getAvailableSlots) and integrate them into the router and booking UI.
  - Then proceed to identity alignment (Phase 2) and beyond.

This step is finalized and validated according to its checklist and is ready as a stable foundation for the following phases.
