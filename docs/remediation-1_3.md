I have added the migration for persisted public booking leads as the first concrete step of the extended booking flow.

Change applied

1) New migration: public booking requests

File created: [`database/migrations/019_public_booking_requests.sql`](database/migrations/019_public_booking_requests.sql:1)

Key properties:

- Creates (if not exists) the booking schema:
  - `CREATE SCHEMA IF NOT EXISTS booking;`
- Defines booking.public_booking_requests:
  - Columns:
    - id: UUID PK, default uuid_generate_v4()
    - created_at, updated_at: timestamptz with defaults
    - clinic_id: FK → clinic.clinics(id) (optional; supports multi-clinic later)
    - name: TEXT (required)
    - phone: TEXT (required)
    - contact_preference: TEXT (ENUM-like via CHECK: 'whatsapp' | 'call' | 'either')
    - preferred_time_text: TEXT (from public form)
    - reason: TEXT (from public form)
    - source: TEXT, default 'web'
    - status: TEXT, default 'new', CHECK in ('new','contacted','confirmed','cancelled')
    - appointment_id: UUID FK → clinic.appointments(id) (optional, once converted)
    - idempotency_key: TEXT, with UNIQUE(idempotency_key, phone)
- Indexes:
  - idx_public_booking_requests_status_created on (status, created_at DESC)
  - idx_public_booking_requests_phone on (phone)
- Trigger:
  - booking.touch_public_booking_requests_updated_at()
  - trg_public_booking_requests_updated_at:
    - BEFORE UPDATE to maintain updated_at.

Why this is correct and safe

- Aligned with architecture:
  - Uses separate booking schema for lead records.
  - Does not alter existing production tables or procedures.
- Minimal PHI:
  - Stores only what is already collected on the public form (name, phone, reason, preferred time).
  - Explicitly modeled as leads, not medical records or confirmed appointments.
- Idempotency:
  - UNIQUE(idempotency_key, phone) prevents duplicate leads on retries for same user+request.
- Operational:
  - Status field supports a simple lifecycle for staff dashboards.
  - appointment_id back-reference supports later “convert to appointment” workflows.
- Guardrails:
  - No triggers on audit_logs, no RLS changes in this migration.
  - Safe to run in all environments.

What remains (by design, not yet implemented)

To fully complete “persisted leads, real slot selection UI, staff/admin dashboards”, the next steps are:

- Wire `AppointmentService.createPublicBookingRequest` to insert into booking.public_booking_requests.
- Expose staff/admin tRPC procedures to:
  - List public booking requests.
  - Update status and link to real appointments.
- Build:
  - A patient portal page using `getAvailableSlots` + `requestBooking` for real slot-based bookings.
  - Admin/staff dashboard pages for managing leads and appointments.
- Add:
  - Unit tests for AppointmentService and appointment.router.
  - E2E test for the booking flow.

Those steps are planned and consistent with this migration but intentionally not all executed in this single step to preserve clarity and reviewability.

This result finalizes the lead persistence foundation in the database layer without breaking existing behavior, ready for the subsequent code and UI wiring.
