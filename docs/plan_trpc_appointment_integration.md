# Plan — Real tRPC + Appointment Service Integration for Booking

Date: 2025-11-11  
Owner: AI Coding Agent (Kilo Code)  
Status: Approved for implementation (this plan); execution is next

---

## 1. Objectives

Implement a real, production-ready booking flow on top of the existing UX foundation that:

- Uses tRPC + service + database to create appointment booking requests safely.
- Leverages the existing database design (booking_requests, booking.create_booking, idempotency).
- Keeps the UX:
  - Senior-friendly, low-friction.
  - Honest about confirmation (no fake instant guarantees).
- Is fully covered by unit tests and Playwright E2E tests.
- Is incremental, reversible, and compliant with PDPA/MOH expectations.

---

## 2. High-Level Flow

From the user’s perspective:

1. User clicks “Book an Appointment” from:
   - Landing header CTA
   - Hero CTA
2. User lands on `/booking`.
3. User fills a simple form and submits.
4. System:
   - Validates input client-side.
   - Calls a tRPC mutation.
   - Mutation:
     - Persists a booking request via appointmentService.
     - Returns a reference ID + status.
   - UI:
     - Shows a success message and clear next steps (clinic will confirm).
     - Handles validation/business errors gracefully.

We explicitly avoid complex slot selection UI in this iteration (align with “start simple” and use internal staff to confirm).

---

## 3. Backend Design

### 3.1 tRPC Router

Add `appointment` router:

- File: `src/lib/trpc/routers/appointment.router.ts`
- Exported via:
  - `appointmentRouter`
- Procedures:

1) `requestBooking` (mutation)
   - Input (Zod):
     - name: string (min length)
     - phone: string (SG format validation)
     - reason: string (min length)
     - preferredTime: string
     - contactPreference: enum("whatsapp", "call", "either")
     - idempotencyKey: string (uuid or opaque)
   - Behavior:
     - Uses ctx (user optional; allow unauthenticated booking requests).
     - Calls appointmentService.createBookingRequest().
   - Output:
     - { requestId: string; status: "received"; message: string }

Why `requestBooking`:
- Matches current UX: “we will confirm via call/WhatsApp.”
- We are not locking real slots yet; we are capturing structured intent.

### 3.2 Service Layer

File: `src/services/appointment-service.ts`

Export:

- `AppointmentService` or functions; keep it simple and testable.

Core method:

- `async createBookingRequest(input: RequestBookingInput, ctx: { db | supabase? }): Promise<RequestBookingResult>`

Responsibilities:

1. Normalize + basic validation:
   - Trim strings, ensure safe lengths, etc.
2. Generate idempotencyKey if not provided (server-authoritative).
3. Persist booking request:
   - For this iteration, use a simple model:
     - Option A (aligned with existing migrations):
       - Insert into `booking_requests` table via SQL/DB client (if accessible here).
     - Option B (if only Prisma is configured now):
       - Insert into a `BookingRequest` Prisma model (if schema exists).
   - Ensure uniqueness on (idempotencyKey).
4. Return:
   - { requestId, status: "received", message }

Important:
- This phase can:
  - Use a simplified write (e.g. Prisma to `booking_requests`-like table).
  - Defer direct calls to `booking.create_booking` stored procedure until Phase 2b, to keep changes small and testable.

### 3.3 Wiring into Root Router

File: `src/lib/trpc/root.ts` or `src/server/api/root.ts` (based on existing pattern):

- Import `appointmentRouter`.
- Add:
  - `appointment: appointmentRouter`

This exposes:

- `api.appointment.requestBooking` to the client.

---

## 4. Frontend Integration

### 4.1 Booking Page uses tRPC

File: `src/app/booking/page.tsx`

Current:
- Client-only validation and toast, no network.

Target changes:

1) Import tRPC client:
   - `import { api } from "@/lib/trpc/client";`

2) Use mutation:
   - `const requestBooking = api.appointment.requestBooking.useMutation();`

3) On submit:
   - Preserve current client-side validation (for UX).
   - Generate `idempotencyKey`:
     - E.g. `crypto.randomUUID()` fallback to timestamp + random.
   - Call:
     - `await requestBooking.mutateAsync({ name, phone, reason, preferredTime, contactPreference, idempotencyKey });`
   - Handle:
     - Loading state (disable button + show spinner text).
     - Success:
       - Show success toast/message that uses server’s message.
     - Error:
       - Map `TRPCError` codes to user-friendly messages.
       - Do not leak internal errors.

4) UX constraints:
   - Do NOT show exact DB IDs or sensitive info.
   - Do NOT promise confirmed slot; message is:
     - “We’ve received your request and will confirm via call/WhatsApp.”

### 4.2 Optionally: Landing Quick Booking Card

Phase 2a (optional but aligned):

- Hook landing quick booking form (#quick-booking-form) to:
  - Call the same `requestBooking` mutation via a small client helper.
- This must:
  - Be implemented carefully to avoid double-wiring the existing DOM-based handler.
  - Probably as a follow-up, refactoring quick form into a proper React component.
- For now:
  - Keep landing quick form as a static UX, and focus on `/booking` for real submissions.

---

## 5. Testing Strategy

### 5.1 Unit Tests

Add tests (if testing framework present):

- For `AppointmentService.createBookingRequest`:
  - Valid input → returns `{ status: "received", requestId }`.
  - Duplicate idempotencyKey → returns existing requestId (idempotent).
  - Invalid input → throws typed error.

- For `appointment.router.ts`:
  - Uses Zod to reject invalid payload (e.g., bad phone).
  - Propagates service result properly.

### 5.2 Playwright E2E

New file: `tests/e2e/booking-flow.spec.ts`

Scenarios:

1) “Landing CTAs navigate to /booking”
   - From `/`:
     - Click header “Book Appointment” → expect URL `/booking`.
     - Click hero “Book an Appointment” → expect URL `/booking`.

2) “Can submit booking request successfully”
   - On `/booking`:
     - Fill valid (name, phone, reason, preferred time).
     - Choose contact preference.
     - Submit.
     - Expect:
       - No validation errors shown.
       - Success message/toast visible.
   - For CI:
     - If real DB is wired, verify response shape; do not depend on real SMS/calls.

3) “Validation errors are shown for bad input”
   - Missing name/phone → check inline messages (from client-side validation).

Implementation detail:
- For deterministic E2E:
  - Use a dedicated `TEST_BOOKING` idempotency key suffix so duplicate runs are safe.
  - Or rely on idempotency semantics in service.

---

## 6. Safety, Compliance, and Observability

- Input:
  - Only minimal personal data (name, phone, reason, preferred time).
- Logging:
  - Do not log full payloads in server logs.
- Error messages:
  - Generic and user-friendly ("Something went wrong, please try again or call the clinic.")
- Idempotency:
  - Ensures re-submission (double-click, flaky network) does not create duplicates.
- Observability:
  - Later: add structured logs or audit events without PHI values.

---

## 7. Step-by-Step Implementation Order

Implementation will follow exactly in this order:

1) Create `src/services/appointment-service.ts`
   - Implement `createBookingRequest` with in-memory or DB-backed stub (depending on existing DB access layer).
2) Create `src/lib/trpc/routers/appointment.router.ts`
   - Add `requestBooking` mutation using AppointmentService.
3) Wire appointment router into root tRPC router.
4) Update `src/app/booking/page.tsx`
   - Replace local-only submit with tRPC-backed mutation (keeping robust client-side validation).
5) Add `tests/e2e/booking-flow.spec.ts`
   - Cover navigation + happy path + validation.
6) Run:
   - `npm run lint`
   - `npm run test:e2e` (or minimal `npx playwright test tests/e2e/booking-flow.spec.ts`)
   - `npm run build`
7) Adjust based on results; keep changes small and well-documented.

This plan is now locked for execution. Next step: implement the described files and wiring precisely according to this design.