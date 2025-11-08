-- database/migrations/005_scheduling_tables.sql

-- ============================================================================
-- Phase 1: Migration 005 - Scheduling Tables (Appointments, Slots)
-- Description: Creates tables for managing appointments, slots, and queues.
-- ============================================================================

SET search_path TO clinic, public;

-- Appointments table: The central record for any patient visit.
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    appointment_type VARCHAR(50) NOT NULL,
    visit_reason TEXT,
    status appointment_status DEFAULT 'scheduled',
    queue_number VARCHAR(10),
    queue_status queue_status,
    checked_in_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ,
    consultation_start_at TIMESTAMPTZ,
    consultation_end_at TIMESTAMPTZ,
    is_telemedicine BOOLEAN DEFAULT false,
    telemedicine_link TEXT,
    telemedicine_session_id VARCHAR(255),
    consultation_fee DECIMAL(10,2),
    additional_charges DECIMAL(10,2) DEFAULT 0,
    chas_applicable BOOLEAN DEFAULT false,
    chas_subsidy_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    pre_consultation_notes TEXT,
    post_consultation_notes TEXT,
    internal_notes TEXT,
    reminder_sent_at TIMESTAMPTZ,
    reminder_channels JSONB DEFAULT '[]',
    source VARCHAR(50),
    booked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id) ON DELETE SET NULL,
    no_show_marked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT valid_total_amount CHECK (total_amount IS NULL OR total_amount >= 0)
);

-- This exclusion constraint is superior to a simple UNIQUE constraint as it
-- properly handles duration, preventing any overlap in a doctor's schedule.
ALTER TABLE appointments ADD CONSTRAINT prevent_appointment_overlap
    EXCLUDE USING gist (
        doctor_id WITH =,
        tstzrange(
            (appointment_date + appointment_time)::timestamptz,
            (appointment_date + appointment_time + (duration_minutes || ' minutes')::interval)::timestamptz
        ) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'rescheduled'));


-- Appointment slots table: Manages doctor availability.
CREATE TABLE IF NOT EXISTS appointment_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    is_available BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_slot UNIQUE(doctor_id, slot_date, slot_time)
);

-- Queue management table: Real-time state of the clinic's waiting room.
CREATE TABLE IF NOT EXISTS queue_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL,
    current_number VARCHAR(10),
    last_called_number VARCHAR(10),
    total_waiting INTEGER DEFAULT 0,
    average_wait_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_queue_date UNIQUE(clinic_id, queue_date)
);

-- Apply the `updated_at` trigger
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointment_slots_updated_at BEFORE UPDATE ON appointment_slots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_queue_management_updated_at BEFORE UPDATE ON queue_management
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
