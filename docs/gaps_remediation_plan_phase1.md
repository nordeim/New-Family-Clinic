Phase 1 — Step 1 applied: AppointmentService updated per remediation plan, with checklist validation.

Changes applied

File:
- [`src/services/appointment-service.ts`](src/services/appointment-service.ts:1)

What was implemented

1) Stable contracts retained and enhanced
- RequestBookingInput:
  - Unchanged fields: name, phone, reason, preferredTime, contactPreference, idempotencyKey?.
- RequestBookingResult:
  - Extended to support:
    - status: "received" | "success"
    - appointmentId?: string
    - appointmentNumber?: string
  - This anticipates future wiring to booking.create_booking while preserving current usage.

2) Clear orchestration responsibility
- AppointmentService is documented as the single orchestration point for booking intents:
  - Router/UI call only createBookingRequest.
  - Future DB logic (booking_requests table, booking.create_booking()) will be implemented here without changing callers.

3) Input validation and normalization preserved
- Validation behavior matches previous implementation:
  - Name required and length-limited.
  - Singapore phone validation (8 digits, starts with 6/8/9).
  - Reason min length.
  - Preferred time required.
  - contactPreference enum enforced.

4) Idempotent behavior preserved
- Uses idempotencyKey (client-provided or generated) as before.
- In-memory map still used to:
  - Deduplicate repeated submissions.
  - Provide deterministic responses within a process.

5) DB integration hook prepared (non-breaking)
- Introduced:
  - createSqlClient() using DATABASE_URL and postgres npm client.
- In createBookingRequest:
  - After writing to inMemoryStore:
    - Best-effort DB hook:
      - If DATABASE_URL exists, instantiate client.
      - Placeholder for future insert into a logging/booking_requests table.
      - Errors are swallowed to avoid breaking UX in constrained environments (like our current sandbox).
- No actual booking.create_booking call yet:
  - This is deliberate: environment cannot reach Supabase DB.
  - Keeps behavior safe and compatible while giving a clear extension point.

Checklist verification (from master_remediation_plan)

For src/services/appointment-service.ts:

- [x] Keep public contract stable (createBookingRequest) for tRPC/UI.
- [x] Centralize validation & normalization (name/phone/reason/preferredTime/contactPreference).
- [x] Enforce idempotency via idempotencyKey with in-memory cache.
- [x] Add clear docs making this the single integration point for future DB/booking.create_booking wiring.
- [x] Introduce a safe, optional Postgres client hook using DATABASE_URL.
- [x] Do NOT introduce breaking changes to callers; UI and router usage remain valid.

No other files have been modified yet. Next steps (not executed in this result)

Following the remediation plan, the next meticulous steps will be:

1) Update [`src/lib/trpc/routers/appointment.router.ts`](src/lib/trpc/routers/appointment.router.ts:1) as needed to:
   - Continue delegating to AppointmentService (already done structurally).
   - Optionally tighten error mapping using TRPCError instead of generic Error.

2) Update [`src/app/booking/page.tsx`](src/app/booking/page.tsx:1) comments to reflect that:
   - The booking now goes through a stable tRPC + AppointmentService pipeline.
   - Actual DB-backed booking will be activated once environment connectivity and Phase 1 DB wiring are completed.

Each of these will be applied and validated against its checklist in subsequent steps, maintaining strict alignment with the master remediation plan.
