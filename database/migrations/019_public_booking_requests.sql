-- database/migrations/019_public_booking_requests.sql
--
-- Phase: Booking Leads Persistence
-- Description:
--   Introduces booking.public_booking_requests to persist public booking intents
--   submitted via the /booking page. This table:
--     - Stores minimal, consented contact details and preferences.
--     - Does NOT create actual appointments or slots.
--     - Provides a safe queue for staff to review and convert into real bookings.
--
-- Notes:
--   - This migration is additive and does not modify existing tables.
--   - It is safe to run in all environments.
--   - Application logic should treat these rows as leads, not confirmed bookings.

SET search_path TO booking, public;

CREATE SCHEMA IF NOT EXISTS booking;

CREATE TABLE IF NOT EXISTS public_booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Optional clinic linkage (for future multi-clinic support)
    clinic_id UUID REFERENCES clinic.clinics(id),

    -- Minimal contact details (as provided via public form)
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    contact_preference TEXT NOT NULL CHECK (contact_preference IN ('whatsapp', 'call', 'either')),

    -- Free-text preferred timing and reason (bounded length enforced in app)
    preferred_time_text TEXT NOT NULL,
    reason TEXT NOT NULL,

    -- Source channel (e.g. 'web', 'staff', 'whatsapp'); default 'web'
    source TEXT NOT NULL DEFAULT 'web',

    -- Lead status lifecycle
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled')),

    -- Optional linkage to a real appointment once created
    appointment_id UUID REFERENCES clinic.appointments(id),

    -- Idempotency key to avoid duplicates on retries (scoped per phone)
    idempotency_key TEXT,
    UNIQUE (idempotency_key, phone)
);

CREATE INDEX IF NOT EXISTS idx_public_booking_requests_status_created
    ON public_booking_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_booking_requests_phone
    ON public_booking_requests (phone);

-- Simple trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION booking.touch_public_booking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_public_booking_requests_updated_at ON public_booking_requests;

CREATE TRIGGER trg_public_booking_requests_updated_at
BEFORE UPDATE ON public_booking_requests
FOR EACH ROW
EXECUTE FUNCTION booking.touch_public_booking_requests_updated_at();