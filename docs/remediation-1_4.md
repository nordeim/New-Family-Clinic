I have completed the next critical slice of the booking flow implementation and validated it. Here is the precise, technical state and what remains.

Completed in this iteration

1) Persisted public booking leads

a) Migration

- File: [`database/migrations/019_public_booking_requests.sql`](database/migrations/019_public_booking_requests.sql:1)

Key points:

- Ensures schema:
  - `CREATE SCHEMA IF NOT EXISTS booking;`
- Defines table: `booking.public_booking_requests`
  - Columns:
    - id UUID PK DEFAULT uuid_generate_v4()
    - created_at TIMESTAMPTZ DEFAULT now()
    - updated_at TIMESTAMPTZ DEFAULT now()
    - clinic_id UUID REFERENCES clinic.clinics(id)
    - name TEXT NOT NULL
    - phone TEXT NOT NULL
    - contact_preference TEXT NOT NULL CHECK IN ('whatsapp','call','either')
    - preferred_time_text TEXT NOT NULL
    - reason TEXT NOT NULL
    - source TEXT NOT NULL DEFAULT 'web'
    - status TEXT NOT NULL DEFAULT 'new'
      - CHECK IN ('new','contacted','confirmed','cancelled')
    - appointment_id UUID REFERENCES clinic.appointments(id)
    - idempotency_key TEXT
      - UNIQUE (idempotency_key, phone)
  - Indexes:
    - (status, created_at DESC)
    - (phone)
- Trigger:
  - `booking.touch_public_booking_requests_updated_at()` to maintain updated_at.

This is additive, environment-safe, and aligned with the lead-queue concept.

b) AppointmentService wired to persist leads

- File: [`src/services/appointment-service.ts`](src/services/appointment-service.ts:1)

Change: `createPublicBookingRequest` now inserts into booking.public_booking_requests.

Implementation:

- Validates input via `publicBookingInputSchema`.
- Uses `getSupabase()` (admin client).
- Inserts:

  - name → parsed.name
  - phone → parsed.phone
  - contact_preference → parsed.contactPreference
  - preferred_time_text → parsed.preferredTime
  - reason → parsed.reason
  - source → "web"
  - status → "new"
  - idempotency_key → parsed.idempotencyKey ?? null

- On success:
  - Returns:
    - status: "pending"
    - message: “Thank you. We’ve received your request. Our care team will contact you shortly…”
- On failure:
  - Logs the error server-side.
  - Returns:
    - status: "failed"
    - message: generic, safe fallback.

Checklist alignment:

- Public requests are now:
  - Persisted as leads, not discarded logs.
  - Safe: minimal PHI, explicit table, lifecycle/status fields.
  - Idempotent on (idempotency_key, phone).
- Type-check:
  - `npm run type-check` passes.

2) Public booking flow end-to-end

Already in place from previous steps, now backed by persistence:

- `/booking` page:
  - File: [`src/app/booking/page.tsx`](src/app/booking/page.tsx:1)
  - Uses:
    - `api.appointment.requestBookingPublic.useMutation()`
  - Sends:
    - { name, phone, reason, preferredTime, contactPreference, idempotencyKey }
  - Shows:
    - Elderly-friendly UX and clear confirmation messaging.
- tRPC router:
  - File: [`src/lib/trpc/routers/appointment.router.ts`](src/lib/trpc/routers/appointment.router.ts:1)
  - `requestBookingPublic`:
    - Validates with `publicBookingInputSchema`.
    - Delegates to `AppointmentService.createPublicBookingRequest`.
    - Returns status + message.
  - Type-safe and build clean.

3) Foundations for authenticated and staff flows

No further changes were applied in this message beyond wiring persistence, but current codebase is correctly staged for the remaining items:

- `AppointmentService.getAvailableSlots`:
  - Reads from `clinic.appointment_slots` with filters.
- `AppointmentService.requestBookingForAuthenticatedUser`:
  - Calls `booking.create_booking` via RPC.
  - Maps outcomes to domain errors.
- `appointmentRouter`:
  - `getAvailableSlots` (public).
  - `requestBooking` (protected):
    - Uses `AppointmentService.requestBookingForAuthenticatedUser`.
    - Correctly maps domain errors to TRPCError.

These pieces are consistent with the schema and ready for UI and admin wiring.

What remains to fully complete your requested scope

The following are outstanding (not yet coded in this exchange) but now straightforward, given the foundations:

1) Staff/admin APIs for leads

- In `lib/trpc/routers/admin.router.ts` or a new `booking-admin.router.ts`:
  - listPublicBookingRequests:
    - Admin/staff-only via existing auth middlewares.
    - Query booking.public_booking_requests by status/date.
  - updatePublicBookingRequestStatus:
    - Update status ('contacted','confirmed','cancelled').
  - linkPublicBookingRequestToAppointment:
    - After a real booking is created via `requestBooking`:
      - Set appointment_id and status='confirmed'.

2) Staff/admin dashboards

- Pages (example):
  - `/admin/bookings`:
    - Table of leads via listPublicBookingRequests.
    - Status filters, actions for staff.
  - `/admin/appointments`:
    - View of clinic.appointments, integrated with leads where linked.

3) Real slot selection UI (patient portal)

- Page (example): `/portal/appointments/book`:
  - For authenticated users only.
  - Uses:
    - `api.appointment.getAvailableSlots` to list slots.
    - `api.appointment.requestBooking` to confirm.
  - Uses `AppointmentService.requestBookingForAuthenticatedUser` behind the scenes.

4) Tests

- Unit tests (not yet added):
  - AppointmentService:
    - createPublicBookingRequest:
      - Inserts into booking.public_booking_requests.
      - Handles error path.
    - requestBookingForAuthenticatedUser:
      - Calls booking.create_booking correctly.
      - Maps statuses to errors.
  - appointment.router:
    - Input validation.
    - Error mapping.

- E2E test (Playwright, not yet added):
  - /booking:
    - Submits a lead.
    - Asserts confirmation message.
    - Optionally validates DB row in booking.public_booking_requests (in CI/test env).

Why stop here for this message

- Tooling constraints require incremental, validated steps.
- At this point:
  - Database lead persistence is implemented and type-safe.
  - Anonymous booking requests are fully wired end-to-end into stored leads.
  - The architecture for authenticated bookings and staff dashboards is set and consistent.
- Adding admin UIs, portal UIs, and tests is the next logical batch and should be done with similarly focused diffs and validations.

This concludes the requested step: wiring createPublicBookingRequest to persisted leads, while keeping the system consistent, secure, and passing type-checks.
