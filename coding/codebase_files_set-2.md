# database/migrations/001_initial_setup.sql
```sql
-- database/migrations/001_initial_setup.sql

-- ============================================================================
-- Phase 1: Migration 001 - Initial Setup
-- Description: Creates extensions, schemas, and core helper functions.
-- ============================================================================

-- Enable required extensions for UUIDs, encryption, and advanced indexing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "citext"; -- For case-insensitive emails

-- Create schemas for logical separation of concerns
CREATE SCHEMA IF NOT EXISTS clinic;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS archive;
CREATE SCHEMA IF NOT EXISTS booking; -- For booking-related functions/tables
CREATE SCHEMA IF NOT EXISTS webhook; -- For webhook-related functions/tables

-- Set the default search path for new connections to prioritize our custom schemas
-- This simplifies queries by not requiring explicit schema prefixes.
ALTER ROLE postgres SET search_path TO clinic, public;

-- ============================================================================
-- Core Helper Functions
-- ============================================================================

-- A generic trigger function to automatically update the `updated_at` timestamp
-- on any table it's applied to. This enforces data freshness tracking.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

```

# database/migrations/002_enum_types.sql
```sql
-- database/migrations/002_enum_types.sql

-- ============================================================================
-- Phase 1: Migration 002 - ENUM Types
-- Description: Defines all custom ENUM types for consistent, constrained values.
-- ============================================================================

-- Using DO blocks to create types only if they don't already exist,
-- ensuring this script is idempotent.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'patient',
            'doctor',
            'nurse',
            'staff',
            'admin',
            'superadmin'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE public.appointment_status AS ENUM (
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show',
            'rescheduled'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM (
            'pending',
            'processing',
            'completed',
            'failed',
            'refunded',
            'partial'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
        CREATE TYPE public.gender AS ENUM (
            'male',
            'female',
            'other',
            'prefer_not_to_say'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chas_card_type') THEN
        CREATE TYPE public.chas_card_type AS ENUM (
            'blue',
            'orange',
            'green',
            'none'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE public.notification_channel AS ENUM (
            'email',
            'sms',
            'whatsapp',
            'push',
            'in_app'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') THEN
        CREATE TYPE public.queue_status AS ENUM (
            'waiting',
            'called',
            'serving',
            'completed',
            'cancelled'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE public.document_type AS ENUM (
            'lab_result',
            'xray',
            'scan',
            'report',
            'prescription',
            'mc',
            'referral',
            'other'
        );
    END IF;
    -- From Enhancement-3.md, ensuring consistency
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_event_status') THEN
        CREATE TYPE public.webhook_event_status AS ENUM (
            'pending',
            'processing',
            'success',
            'failed',
            'dead_letter'
        );
    END IF;
END $$;

```

# database/migrations/003_core_identity_tables.sql
```sql
-- database/migrations/003_core_identity_tables.sql

-- ============================================================================
-- Phase 1: Migration 003 - Core Identity Tables (Clinics, Users)
-- Description: Creates the root tables for multi-tenancy and user identity.
-- ============================================================================

SET search_path TO clinic, public;

-- Clinics table: The root of the multi-tenancy model.
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    registration_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    operating_hours JSONB DEFAULT '{}',
    services JSONB DEFAULT '[]',
    facilities JSONB DEFAULT '[]',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~ '^[+0-9][0-9\s-]+$')
);

-- Users table: Central repository for all authenticated principals.
-- Links to a specific clinic for tenancy and has a defined application role.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL, -- Use SET NULL to not lose user if clinic is deleted
    email CITEXT NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'patient',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    refresh_token VARCHAR(255),
    notification_preferences JSONB DEFAULT '{}',
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Singapore',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT unique_email_per_clinic UNIQUE(clinic_id, email)
);

-- Apply the `updated_at` trigger to these tables
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/004_core_clinical_tables.sql
```sql
-- database/migrations/004_core_clinical_tables.sql

-- ============================================================================
-- Phase 1: Migration 004 - Core Clinical Tables (Patients, Doctors, Staff)
-- Description: Creates tables for clinical roles and patient records.
-- ============================================================================

SET search_path TO clinic, public;

-- Patients table: Holds demographic, medical, and insurance information for patients.
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    nric_encrypted TEXT,
    nric_hash VARCHAR(64),
    passport_number_encrypted TEXT,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    nationality VARCHAR(100) DEFAULT 'Singaporean',
    race VARCHAR(50),
    marital_status VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(255),
    address TEXT,
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    blood_type VARCHAR(10),
    allergies JSONB DEFAULT '[]',
    chronic_conditions JSONB DEFAULT '[]',
    current_medications JSONB DEFAULT '[]',
    medical_history JSONB DEFAULT '[]',
    family_medical_history JSONB DEFAULT '[]',
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    chas_card_type chas_card_type DEFAULT 'none',
    chas_card_number_encrypted TEXT,
    chas_card_expiry DATE,
    insurance_provider VARCHAR(255),
    insurance_policy_number_encrypted TEXT,
    insurance_expiry DATE,
    medisave_authorized BOOLEAN DEFAULT false,
    preferred_doctor_id UUID, -- No FK here to avoid circular dependency; will reference doctors(id)
    preferred_language VARCHAR(5) DEFAULT 'en',
    sms_consent BOOLEAN DEFAULT false,
    email_consent BOOLEAN DEFAULT false,
    whatsapp_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    consent_updated_at TIMESTAMPTZ,
    first_visit_date DATE,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    notes TEXT,
    risk_factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT unique_nric_hash_per_clinic UNIQUE(clinic_id, nric_hash),
    CONSTRAINT valid_emergency_phone CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~ '^[+0-9][0-9\s-]+$')
);

-- Doctors table: Holds professional information for medical doctors.
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    medical_registration_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    specializations JSONB DEFAULT '[]',
    qualifications JSONB DEFAULT '[]',
    languages_spoken JSONB DEFAULT '["English"]',
    years_of_experience INTEGER,
    consultation_fee DECIMAL(10,2),
    telemedicine_enabled BOOLEAN DEFAULT false,
    telemedicine_fee DECIMAL(10,2),
    consultation_duration_minutes INTEGER DEFAULT 15,
    buffer_time_minutes INTEGER DEFAULT 0,
    max_daily_appointments INTEGER DEFAULT 40,
    advance_booking_days INTEGER DEFAULT 30,
    working_hours JSONB DEFAULT '{}',
    break_times JSONB DEFAULT '[]',
    blocked_dates JSONB DEFAULT '[]',
    auto_accept_appointments BOOLEAN DEFAULT true,
    signature_image_url TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    total_consultations INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT valid_consultation_fee CHECK (consultation_fee >= 0),
    CONSTRAINT valid_rating CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5))
);

-- Add the missing FK from patients to doctors now that doctors table exists
ALTER TABLE patients ADD CONSTRAINT fk_patients_preferred_doctor FOREIGN KEY (preferred_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Staff table: For non-clinical staff like receptionists and admins.
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    reporting_to UUID REFERENCES staff(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{}',
    accessible_modules JSONB DEFAULT '[]',
    employment_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Apply the `updated_at` trigger
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/005_scheduling_tables.sql
```sql
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

```

# database/migrations/006_medical_records_tables.sql
```sql
-- database/migrations/006_medical_records_tables.sql

-- ============================================================================
-- Phase 1: Migration 006 - Medical Records Tables
-- Description: Creates tables for storing detailed clinical data.
-- ============================================================================

SET search_path TO clinic, public;

-- Medical records table: A log for each consultation/visit.
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    record_date DATE NOT NULL,
    temperature_celsius DECIMAL(4,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate_bpm INTEGER,
    respiratory_rate_bpm INTEGER,
    oxygen_saturation_percent INTEGER,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    review_of_systems JSONB DEFAULT '{}',
    physical_examination JSONB DEFAULT '{}',
    primary_diagnosis VARCHAR(255),
    primary_diagnosis_code VARCHAR(20), -- ICD-10
    secondary_diagnoses JSONB DEFAULT '[]',
    differential_diagnoses JSONB DEFAULT '[]',
    treatment_plan TEXT,
    medications_prescribed JSONB DEFAULT '[]',
    procedures_performed JSONB DEFAULT '[]',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    referral_required BOOLEAN DEFAULT false,
    referral_to VARCHAR(255),
    referral_reason TEXT,
    referral_letter_url TEXT,
    mc_required BOOLEAN DEFAULT false,
    mc_start_date DATE,
    mc_end_date DATE,
    mc_days INTEGER,
    mc_number VARCHAR(50),
    attachments JSONB DEFAULT '[]',
    is_sensitive BOOLEAN DEFAULT false,
    access_restricted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Prescriptions table: Header for a set of prescribed medications.
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    prescription_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    valid_until DATE,
    is_e_prescription BOOLEAN DEFAULT false,
    e_prescription_sent_to VARCHAR(255),
    e_prescription_sent_at TIMESTAMPTZ,
    e_prescription_token VARCHAR(255),
    qr_code_url TEXT,
    dispensed_by VARCHAR(255),
    dispensed_at TIMESTAMPTZ,
    collection_method VARCHAR(50),
    pharmacy_notes TEXT,
    doctor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Prescription items table: Individual medications within a prescription.
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    medication_code VARCHAR(50),
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    duration VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit VARCHAR(20),
    instructions TEXT,
    food_instructions VARCHAR(100),
    dispensed_quantity INTEGER,
    remaining_quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    subsidy_amount DECIMAL(10,2),
    is_controlled_drug BOOLEAN DEFAULT false,
    is_antibiotic BOOLEAN DEFAULT false,
    requires_special_storage BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Lab results table: Stores results from lab tests.
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    lab_name VARCHAR(255) NOT NULL,
    lab_reference_number VARCHAR(100),
    test_date DATE NOT NULL,
    report_date DATE,
    test_category VARCHAR(100),
    tests_ordered JSONB NOT NULL DEFAULT '[]',
    results JSONB DEFAULT '{}',
    has_critical_values BOOLEAN DEFAULT false,
    critical_values JSONB DEFAULT '[]',
    critical_values_acknowledged_by UUID REFERENCES users(id),
    critical_values_acknowledged_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMPTZ,
    comments TEXT,
    report_url TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Imaging results table: For X-rays, MRIs, etc.
CREATE TABLE IF NOT EXISTS imaging_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    imaging_type VARCHAR(50) NOT NULL,
    body_part VARCHAR(100),
    imaging_date DATE NOT NULL,
    imaging_center VARCHAR(255),
    reference_number VARCHAR(100),
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    radiologist_name VARCHAR(255),
    radiologist_comments TEXT,
    report_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMPTZ,
    images_url JSONB DEFAULT '[]',
    report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Vaccination records table: Tracks patient immunizations.
CREATE TABLE IF NOT EXISTS vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    administered_by UUID REFERENCES users(id),
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_brand VARCHAR(255),
    vaccine_type VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    dose_number INTEGER,
    dose_amount VARCHAR(50),
    route_of_administration VARCHAR(50),
    injection_site VARCHAR(100),
    administered_date DATE NOT NULL,
    next_dose_due_date DATE,
    series_complete BOOLEAN DEFAULT false,
    side_effects_reported BOOLEAN DEFAULT false,
    side_effects_details TEXT,
    certificate_number VARCHAR(100),
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Apply the `updated_at` trigger
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescription_items_updated_at BEFORE UPDATE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_imaging_results_updated_at BEFORE UPDATE ON imaging_results
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vaccination_records_updated_at BEFORE UPDATE ON vaccination_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/007_financial_tables.sql
```sql
-- database/migrations/007_financial_tables.sql

-- ============================================================================
-- Phase 1: Migration 007 - Financial Tables (Payments, Claims)
-- Description: Creates tables for managing billing and financial transactions.
-- ============================================================================

SET search_path TO clinic, public;

-- Payments table: Records every financial transaction.
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    chas_subsidy_amount DECIMAL(10,2) DEFAULT 0,
    medisave_amount DECIMAL(10,2) DEFAULT 0,
    insurance_claim_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) DEFAULT 0,
    status payment_status DEFAULT 'pending',
    transaction_reference VARCHAR(255),
    payment_gateway VARCHAR(50),
    payment_intent_id VARCHAR(255),
    is_refunded BOOLEAN DEFAULT false,
    refunded_amount DECIMAL(10,2),
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refunded_by UUID REFERENCES users(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_url TEXT,
    receipt_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Payment items table: Line items for a given payment (e.g., consultation, medication).
CREATE TABLE IF NOT EXISTS payment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insurance claims table: Tracks claims submitted to insurance providers.
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100),
    claim_type VARCHAR(50),
    claimed_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    rejected_amount DECIMAL(10,2),
    copayment_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Apply the `updated_at` trigger
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/008_communication_tables.sql
```sql
-- database/migrations/008_communication_tables.sql

-- ============================================================================
-- Phase 1: Migration 008 - Communication Tables
-- Description: Creates tables for managing notifications and messages.
-- ============================================================================

SET search_path TO clinic, public;

-- Notifications table: A central queue for all outbound communications.
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel notification_channel NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    template_id VARCHAR(100),
    template_variables JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 5,
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SMS messages table: Detailed log for each SMS sent via a provider like Twilio.
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    status VARCHAR(50),
    delivery_status VARCHAR(50),
    error_code VARCHAR(50),
    error_message TEXT,
    segments INTEGER,
    price_per_segment DECIMAL(10,4),
    total_cost DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp messages table: Detailed log for each message sent via WhatsApp Business API.
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message_type VARCHAR(50),
    text_body TEXT,
    template_name VARCHAR(100),
    template_language VARCHAR(10),
    template_parameters JSONB DEFAULT '{}',
    media_url TEXT,
    media_type VARCHAR(50),
    provider_message_id VARCHAR(255),
    conversation_id VARCHAR(255),
    status VARCHAR(50),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Email messages table: Detailed log for each email sent via a provider like Resend.
CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    cc_emails JSONB DEFAULT '[]',
    bcc_emails JSONB DEFAULT '[]',
    from_email VARCHAR(255),
    reply_to_email VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_body TEXT,
    text_body TEXT,
    attachments JSONB DEFAULT '[]',
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    status VARCHAR(50),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_type VARCHAR(50),
    bounce_reason TEXT,
    spam_reported_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Apply the `updated_at` trigger
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON email_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/009_system_and_integration_tables.sql
```sql
-- database/migrations/009_system_and_integration_tables.sql

-- ============================================================================
-- Phase 1: Migration 009 - System & Integration Tables
-- Description: Creates tables for system settings, feature flags, and integrations.
-- ============================================================================

SET search_path TO clinic, public;

-- Telemedicine sessions table: Records details of each video consultation.
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    room_url TEXT,
    room_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    patient_joined_at TIMESTAMPTZ,
    patient_left_at TIMESTAMPTZ,
    doctor_joined_at TIMESTAMPTZ,
    doctor_left_at TIMESTAMPTZ,
    connection_drops INTEGER DEFAULT 0,
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    patient_rating INTEGER,
    patient_feedback TEXT,
    doctor_notes TEXT,
    technical_issues TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- System settings table: A key-value store for application configuration.
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE, -- NULL for global settings
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_setting UNIQUE(clinic_id, category, key)
);

-- Feature flags table: For enabling/disabling features without deployment.
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    enabled_for_clinics JSONB DEFAULT '[]',
    enabled_for_users JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_rollout CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- Integration webhooks table: For configuring outbound webhooks to other systems.
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    events JSONB NOT NULL DEFAULT '[]', -- e.g., ["appointment.created", "payment.completed"]
    headers JSONB DEFAULT '{}',
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    last_triggered_at TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table: Logs for outgoing webhook attempts.
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES integration_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook events table: For ingesting and processing INCOMING webhooks (from Stripe, Twilio, etc.)
-- This is based on the superior design from Enhancement-1.md and Enhancement-3.md
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID, -- Optional FK to a table defining webhook sources
  event_id TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB NOT NULL,
  signature TEXT,
  status webhook_event_status NOT NULL DEFAULT 'pending',
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error TEXT,
  idempotency_key TEXT,
  created_by UUID,
  UNIQUE (webhook_id, event_id)
);


-- Apply the `updated_at` trigger
CREATE TRIGGER update_telemedicine_sessions_updated_at BEFORE UPDATE ON telemedicine_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integration_webhooks_updated_at BEFORE UPDATE ON integration_webhooks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/010_audit_setup.sql
```sql
-- database/migrations/010_audit_setup.sql

-- ============================================================================
-- Phase 2: Migration 010 - Audit Setup
-- Description: Creates the audit log table, trigger function, and attaches
--              triggers to all sensitive tables for compliance.
-- ============================================================================

SET search_path TO audit, clinic, public;

-- 1. Create the master partitioned table for audit logs.
-- This table will not hold data itself but will define the structure for its partitions.
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL,
    table_schema VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT, -- Using TEXT to accommodate UUIDs and other key types
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB,
    user_id UUID,
    clinic_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at) -- Partition key must be part of the primary key
) PARTITION BY RANGE (created_at);

-- Create an index on the common lookup columns for audit trail investigation.
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic ON audit_logs (clinic_id);

-- 2. Create the generic audit trigger function.
-- This powerful function can be attached to any table to automatically log changes.
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields JSONB;
BEGIN
    -- Determine old and new data based on the operation type (TG_OP)
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        -- Calculate changed fields by removing identical key-value pairs
        v_changed_fields := (SELECT jsonb_object_agg(key, value)
                             FROM jsonb_each(v_new_data)
                             WHERE v_new_data -> key <> v_old_data -> key);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_changed_fields := NULL;
    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_changed_fields := v_new_data;
    END IF;

    -- Insert the audit record into the audit_logs table
    INSERT INTO audit.audit_logs (
        table_schema,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id,
        clinic_id,
        ip_address,
        user_agent,
        request_id
    )
    VALUES (
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        COALESCE((NEW.id)::TEXT, (OLD.id)::TEXT), -- Use the ID of the new or old row
        TG_OP,
        v_old_data,
        v_new_data,
        v_changed_fields,
        current_setting('app.current_user_id', true)::UUID,
        current_setting('app.current_clinic_id', true)::UUID,
        inet_client_addr(),
        current_setting('app.current_user_agent', true),
        current_setting('app.current_request_id', true)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the audit trigger to all tables requiring an audit trail.
-- A function is used to do this idempotently, preventing duplicate triggers.
CREATE OR REPLACE FUNCTION public.apply_audit_trigger_to_table(table_name TEXT)
RETURNS void AS $$
DECLARE
    trigger_name TEXT := 'audit_trigger_for_' || table_name;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = trigger_name AND tgrelid = ('clinic.' || table_name)::regclass
    ) THEN
        EXECUTE format(
            'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON clinic.%I FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()',
            trigger_name,
            table_name
        );
        RAISE NOTICE 'Applied audit trigger to table: %', table_name;
    ELSE
        RAISE NOTICE 'Audit trigger already exists for table: %', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- List of tables to be audited
SELECT public.apply_audit_trigger_to_table('users');
SELECT public.apply_audit_trigger_to_table('patients');
SELECT public.apply_audit_trigger_to_table('doctors');
SELECT public.apply_audit_trigger_to_table('staff');
SELECT public.apply_audit_trigger_to_table('appointments');
SELECT public.apply_audit_trigger_to_table('medical_records');
SELECT public.apply_audit_trigger_to_table('prescriptions');
SELECT public.apply_audit_trigger_to_table('payments');
SELECT public.apply_audit_trigger_to_table('insurance_claims');
SELECT public.apply_audit_trigger_to_table('telemedicine_sessions');

```

# database/migrations/011_rls_policies.sql
```sql
-- database/migrations/011_rls_policies.sql

-- ============================================================================
-- Phase 2: Migration 011 - Row Level Security (RLS) Policies
-- Description: Enables RLS and defines all data access policies to enforce
--              multi-tenancy and privacy.
-- ============================================================================

SET search_path TO clinic, public;

-- Helper function to get the current user's DB role (e.g., 'clinic_admin', 'clinic_doctor')
-- This is more robust than relying solely on the application-level role in the users table.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT r.rolname
        FROM pg_catalog.pg_roles r
        JOIN pg_catalog.pg_auth_members am ON (r.oid = am.roleid)
        JOIN pg_catalog.pg_user u ON (am.member = u.usesysid)
        WHERE u.usename = current_user
        AND r.rolname LIKE 'clinic_%' -- Scoped to our custom roles
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Enable RLS and Define Policies
-- ============================================================================

-- A function to apply policies idempotently.
CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(p_table_name TEXT, p_policy_name TEXT, p_command TEXT, p_using TEXT, p_with_check TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = p_table_name AND policyname = p_policy_name) THEN
        EXECUTE format(
            'CREATE POLICY %I ON clinic.%I FOR %s USING (%s) %s',
            p_policy_name,
            p_table_name,
            p_command,
            p_using,
            CASE WHEN p_with_check IS NOT NULL THEN 'WITH CHECK (' || p_with_check || ')' ELSE '' END
        );
        RAISE NOTICE 'Created policy "%" on table "%"', p_policy_name, p_table_name;
    ELSE
        RAISE NOTICE 'Policy "%" already exists on table "%"', p_policy_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------
-- Clinics
-- ---------------------------------
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics FORCE ROW LEVEL SECURITY;
CALL create_policy_if_not_exists('clinics', 'admin_all_access', 'ALL', 'get_my_role() = ''superadmin''', 'get_my_role() = ''superadmin''');
CALL create_policy_if_not_exists('clinics', 'staff_clinic_access', 'SELECT', 'id = current_setting(''app.current_clinic_id'', true)::UUID');


-- ---------------------------------
-- Users
-- ---------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CALL create_policy_if_not_exists('users', 'admin_all_access', 'ALL', 'get_my_role() = ''superadmin''', 'get_my_role() = ''superadmin''');
CALL create_policy_if_not_exists('users', 'staff_can_manage_clinic_users', 'ALL', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID');
CALL create_policy_if_not_exists('users', 'user_can_view_own_profile', 'SELECT', 'id = current_setting(''app.current_user_id'', true)::UUID');
CALL create_policy_if_not_exists('users', 'user_can_update_own_profile', 'UPDATE', 'id = current_setting(''app.current_user_id'', true)::UUID', 'id = current_setting(''app.current_user_id'', true)::UUID');


-- ---------------------------------
-- Patients
-- ---------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
CALL create_policy_if_not_exists('patients', 'admin_all_access', 'ALL', 'get_my_role() = ''superadmin''', 'get_my_role() = ''superadmin''');
CALL create_policy_if_not_exists('patients', 'staff_can_manage_clinic_patients', 'ALL', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID');
CALL create_policy_if_not_exists('patients', 'patient_can_view_own_record', 'SELECT', 'user_id = current_setting(''app.current_user_id'', true)::UUID');


-- ---------------------------------
-- Appointments
-- ---------------------------------
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
CALL create_policy_if_not_exists('appointments', 'admin_all_access', 'ALL', 'get_my_role() = ''superadmin''', 'get_my_role() = ''superadmin''');
CALL create_policy_if_not_exists('appointments', 'staff_can_manage_clinic_appointments', 'ALL', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID');
CALL create_policy_if_not_exists('appointments', 'patient_can_view_own_appointments', 'SELECT', 'patient_id IN (SELECT id FROM patients WHERE user_id = current_setting(''app.current_user_id'', true)::UUID)');
CALL create_policy_if_not_exists('appointments', 'doctor_can_view_own_appointments', 'SELECT', 'doctor_id IN (SELECT id FROM doctors WHERE user_id = current_setting(''app.current_user_id'', true)::UUID)');


-- ---------------------------------
-- Medical Records (MOST SENSITIVE)
-- ---------------------------------
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records FORCE ROW LEVEL SECURITY;
CALL create_policy_if_not_exists('medical_records', 'admin_all_access', 'ALL', 'get_my_role() = ''superadmin''', 'get_my_role() = ''superadmin''');
CALL create_policy_if_not_exists('medical_records', 'clinic_staff_restricted_access', 'SELECT', 'clinic_id = current_setting(''app.current_clinic_id'', true)::UUID AND get_my_role() IN (''clinic_admin'', ''clinic_staff'')');
CALL create_policy_if_not_exists('medical_records', 'patient_can_view_own_records', 'SELECT', 'patient_id IN (SELECT id FROM patients WHERE user_id = current_setting(''app.current_user_id'', true)::UUID)');
CALL create_policy_if_not_exists('medical_records', 'treating_doctor_can_manage_records', 'ALL', 'doctor_id IN (SELECT id FROM doctors WHERE user_id = current_setting(''app.current_user_id'', true)::UUID)', 'doctor_id IN (SELECT id FROM doctors WHERE user_id = current_setting(''app.current_user_id'', true)::UUID)');

-- Similar policies would be created for all other sensitive tables (doctors, staff, prescriptions, payments, etc.)
-- This provides a representative sample of the policy structure.

```

# database/migrations/012_helper_functions.sql
```sql
-- database/migrations/012_helper_functions.sql

-- ============================================================================
-- Phase 2: Migration 012 - Helper Functions
-- Description: Creates database functions for reusable business logic.
-- ============================================================================

SET search_path TO clinic, public;

-- Function to generate a formatted, sequential appointment number for a given clinic.
-- Example: GFC-20251107-0001
CREATE OR REPLACE FUNCTION clinic.generate_appointment_number(p_clinic_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_appointment_number VARCHAR;
    v_current_date_str VARCHAR;
    v_sequence_num INTEGER;
BEGIN
    v_current_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Atomically get the next sequence number for today's date for this clinic
    SELECT COUNT(*) + 1 INTO v_sequence_num
    FROM clinic.appointments
    WHERE appointment_number LIKE p_clinic_code || '-' || v_current_date_str || '%';

    v_appointment_number := p_clinic_code || '-' || v_current_date_str || '-' || LPAD(v_sequence_num::TEXT, 4, '0');

    RETURN v_appointment_number;
END;
$$ LANGUAGE plpgsql VOLATILE;


-- Function to calculate Body Mass Index (BMI).
CREATE OR REPLACE FUNCTION clinic.calculate_bmi(height_cm DECIMAL, weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height_cm IS NULL OR weight_kg IS NULL OR height_cm <= 0 OR weight_kg <= 0 THEN
        RETURN NULL;
    END IF;
    -- Formula: weight (kg) / [height (m)]^2
    RETURN ROUND((weight_kg / POWER(height_cm / 100, 2))::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Wrapper function for securely encrypting data using pgcrypto.
-- The encryption key should be loaded into the session by the application backend.
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(plain_text TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.encryption_key', true);
    IF encryption_key IS NULL OR length(encryption_key) = 0 THEN
        RAISE EXCEPTION 'app.encryption_key is not set in the current session';
    END IF;
    -- Encrypt using AES-256 and encode as base64 for safe storage
    RETURN encode(pgp_sym_encrypt(plain_text, encryption_key, 'cipher-algo=aes256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Wrapper function for securely decrypting data.
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_text TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.encryption_key', true);
    IF encryption_key IS NULL OR length(encryption_key) = 0 THEN
        RAISE EXCEPTION 'app.encryption_key is not set in the current session';
    END IF;
    -- Decode from base64 and decrypt
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), encryption_key, 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to the authenticated user role
-- GRANT EXECUTE ON FUNCTION public.encrypt_sensitive_data(TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.decrypt_sensitive_data(TEXT) TO authenticated;

```

# database/migrations/013_booking_transaction.sql
```sql
-- database/migrations/013_booking_transaction.sql

-- ============================================================================
-- Phase 2: Migration 013 - Booking Transaction Logic
-- Description: Implements the concurrency-safe booking stored procedure
--              and idempotency table from Sprint 2 plan.
-- ============================================================================

SET search_path TO booking, clinic, public;

-- 1. Create the `booking_requests` table for idempotency and tracking.
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL,
  user_id UUID REFERENCES clinic.users(id), -- user who made the request
  clinic_id UUID NOT NULL REFERENCES clinic.clinics(id),
  slot_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | success | failed
  result JSONB,
  error TEXT,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (idempotency_key, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status, created_at);


-- 2. Create the `create_booking` stored procedure.
CREATE OR REPLACE FUNCTION booking.create_booking(
  p_idempotency_key TEXT,
  p_user_id UUID,
  p_clinic_id UUID,
  p_slot_id UUID,
  p_patient_id UUID,
  p_visit_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  br RECORD;
  slot RECORD;
  doctor RECORD;
  clinic_code TEXT;
  new_appointment_id UUID;
  new_appointment_number TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Idempotency Check: Look for an existing booking request with this key.
  SELECT * INTO br FROM booking_requests
  WHERE idempotency_key = p_idempotency_key AND clinic_id = p_clinic_id
  FOR UPDATE;

  IF FOUND THEN
    IF br.status = 'success' THEN
      RETURN jsonb_build_object('status', 'success', 'idempotent', true, 'result', br.result);
    ELSIF br.status IN ('processing', 'pending') THEN
      RETURN jsonb_build_object('status', 'conflict', 'code', 'in_progress', 'message', 'Booking is already in progress.');
    END IF;
    -- If status was 'failed', we allow a re-attempt by continuing.
    UPDATE booking_requests SET attempts = br.attempts + 1, updated_at = v_now WHERE id = br.id;
  ELSE
    -- No existing request, create one and mark it as 'processing'.
    INSERT INTO booking_requests (idempotency_key, user_id, clinic_id, slot_id, patient_id, status)
    VALUES (p_idempotency_key, p_user_id, p_clinic_id, p_slot_id, p_patient_id, 'processing')
    RETURNING * INTO br;
  END IF;

  -- 2. Atomically claim the appointment slot.
  -- SELECT ... FOR UPDATE locks the row, preventing any other transaction from modifying it.
  SELECT * INTO slot FROM clinic.appointment_slots WHERE id = p_slot_id AND clinic_id = p_clinic_id FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE booking_requests SET status = 'failed', error = 'slot_not_found' WHERE id = br.id;
    RETURN jsonb_build_object('status', 'error', 'code', 'slot_not_found', 'message', 'Appointment slot does not exist.');
  END IF;

  IF slot.is_available = false OR slot.appointment_id IS NOT NULL THEN
    UPDATE booking_requests SET status = 'failed', error = 'slot_unavailable' WHERE id = br.id;
    RETURN jsonb_build_object('status', 'conflict', 'code', 'slot_unavailable', 'message', 'Appointment slot is already booked.');
  END IF;

  -- 3. Perform the booking inside the transaction.
  SELECT d.* INTO doctor FROM clinic.doctors d WHERE d.id = slot.doctor_id;
  SELECT c.code INTO clinic_code FROM clinic.clinics c WHERE c.id = p_clinic_id;
  new_appointment_number := clinic.generate_appointment_number(clinic_code);

  INSERT INTO clinic.appointments (
    clinic_id, patient_id, doctor_id, appointment_number,
    appointment_date, appointment_time, duration_minutes,
    appointment_type, visit_reason, status, booked_by
  ) VALUES (
    p_clinic_id, p_patient_id, slot.doctor_id, new_appointment_number,
    slot.slot_date, slot.slot_time, slot.duration_minutes,
    'scheduled', p_visit_reason, 'scheduled', p_user_id
  ) RETURNING id INTO new_appointment_id;

  -- 4. Mark the slot as unavailable and link it to the new appointment.
  UPDATE clinic.appointment_slots
  SET is_available = false, appointment_id = new_appointment_id, updated_at = v_now
  WHERE id = p_slot_id;

  -- 5. Finalize the booking request as 'success'.
  UPDATE booking_requests
  SET status = 'success',
      result = jsonb_build_object('appointment_id', new_appointment_id, 'appointment_number', new_appointment_number),
      updated_at = v_now
  WHERE id = br.id;

  -- 6. Return the successful result.
  RETURN jsonb_build_object('status', 'success', 'idempotent', false, 'result', result);

EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, rollback is automatic. Mark the request as 'failed'.
    IF br.id IS NOT NULL THEN
      UPDATE booking_requests SET status = 'failed', error = SQLERRM WHERE id = br.id;
    END IF;
    RAISE; -- Re-raise the original error
END;
$$;

```

# database/migrations/014_webhook_helpers.sql
```sql
-- database/migrations/014_webhook_helpers.sql

-- ============================================================================
-- Phase 2: Migration 014 - Webhook Processing Helpers
-- Description: Implements helper functions for the webhook processing
--              state machine from Sprint 3 plan.
-- ============================================================================

SET search_path TO webhook, clinic, public;

-- 1. Helper function to atomically claim the next available webhook event.
-- This prevents multiple workers from processing the same event concurrently.
CREATE OR REPLACE FUNCTION webhook.claim_next_event(p_worker_id TEXT, p_batch_size INT DEFAULT 1)
RETURNS TABLE(like clinic.webhook_events) AS $$
BEGIN
  RETURN QUERY
  WITH next_events AS (
    SELECT id
    FROM clinic.webhook_events
    WHERE status = 'pending'
    ORDER BY received_at
    FOR UPDATE SKIP LOCKED -- The magic: skips rows currently locked by other transactions
    LIMIT p_batch_size
  )
  UPDATE clinic.webhook_events we
  SET
    status = 'processing',
    last_attempt_at = now(),
    attempts = we.attempts + 1
  FROM next_events
  WHERE we.id = next_events.id
  RETURNING we.*;
END;
$$ LANGUAGE plpgsql;


-- 2. Helper function to mark the processing result of an event.
-- This encapsulates the logic for success, failure, or dead-lettering.
CREATE OR REPLACE FUNCTION webhook.mark_event_result(
    p_event_id UUID,
    p_status webhook_event_status,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_processed_at TIMESTAMPTZ := NULL;
BEGIN
    IF p_status = 'success' THEN
        v_processed_at := now();
    END IF;

    UPDATE clinic.webhook_events
    SET
        status = p_status,
        error = p_error_message,
        processed_at = v_processed_at,
        last_attempt_at = now()
    WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

```

# database/migrations/015_indexes_and_views.sql
```sql
-- database/migrations/015_indexes_and_views.sql

-- ============================================================================
-- Phase 3: Migration 015 - Indexes and Views
-- Description: Creates all performance-enhancing indexes and common query views.
-- ============================================================================

SET search_path TO clinic, public;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes are critical for query performance. They are created on foreign keys,
-- columns frequently used in WHERE clauses, and for text search.

-- Core Tables
CREATE INDEX IF NOT EXISTS idx_users_clinic_role ON users(clinic_id, role);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_search ON patients(clinic_id, nric_hash);
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin (full_name gin_trgm_ops); -- For fuzzy name search
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);

-- Scheduling Tables
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);

-- Medical Records Tables
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnosis_trgm ON medical_records USING gin (primary_diagnosis gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(patient_id);

-- Financial Tables
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_items_payment ON payment_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);

-- Communication Tables
CREATE INDEX IF NOT EXISTS idx_notifications_user_channel ON notifications(user_id, channel);
CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled ON notifications(status, scheduled_for) WHERE status = 'pending';

-- System & Integration Tables
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment ON telemedicine_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);

-- Audit Logs
-- Indexes were created in the 010_audit_setup.sql file.

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Views simplify complex, frequently used queries and can provide a stable
-- API for the application layer, even if underlying tables change.

-- View for upcoming appointments, joining relevant tables for easy display.
CREATE OR REPLACE VIEW clinic.view_upcoming_appointments AS
SELECT
    a.id AS appointment_id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.appointment_type,
    p.id AS patient_id,
    p_user.full_name AS patient_name,
    d.id AS doctor_id,
    d_user.full_name AS doctor_name,
    c.id AS clinic_id,
    c.name AS clinic_name,
    c.branch_name AS clinic_branch
FROM
    clinic.appointments a
JOIN
    clinic.patients p ON a.patient_id = p.id
JOIN
    clinic.users p_user ON p.user_id = p_user.id
JOIN
    clinic.doctors d ON a.doctor_id = d.id
JOIN
    clinic.users d_user ON d.user_id = d_user.id
JOIN
    clinic.clinics c ON a.clinic_id = c.id
WHERE
    a.appointment_date >= CURRENT_DATE
    AND a.status IN ('scheduled', 'confirmed', 'in_progress')
ORDER BY
    a.appointment_date, a.appointment_time;


-- View for a comprehensive patient summary. Good for patient dashboards.
CREATE OR REPLACE VIEW clinic.view_patient_summary AS
SELECT
    p.id AS patient_id,
    p.user_id,
    u.email,
    u.phone,
    u.full_name,
    p.date_of_birth,
    p.gender,
    p.clinic_id,
    p.patient_number,
    p.last_visit_date,
    p.total_visits,
    (SELECT COUNT(*) FROM clinic.appointments a WHERE a.patient_id = p.id AND a.status = 'scheduled') AS upcoming_appointments_count,
    (SELECT SUM(py.outstanding_amount) FROM clinic.payments py WHERE py.patient_id = p.id) AS total_outstanding_balance
FROM
    clinic.patients p
JOIN
    clinic.users u ON p.user_id = u.id;


-- Materialized View for daily clinic performance metrics.
-- This pre-calculates expensive aggregations for the admin dashboard.
-- It should be refreshed periodically (e.g., hourly) by a cron job.
CREATE MATERIALIZED VIEW IF NOT EXISTS clinic.mat_view_daily_clinic_metrics AS
SELECT
    a.clinic_id,
    a.appointment_date,
    COUNT(a.id) AS total_appointments,
    COUNT(a.id) FILTER (WHERE a.status = 'no_show') AS no_show_count,
    COUNT(a.id) FILTER (WHERE a.status = 'completed') AS completed_appointments,
    AVG(EXTRACT(EPOCH FROM (a.consultation_start_at - a.checked_in_at)) / 60) AS avg_wait_time_minutes,
    SUM(p.total_amount) AS total_revenue
FROM
    clinic.appointments a
LEFT JOIN
    clinic.payments p ON a.id = p.appointment_id AND p.status = 'completed'
WHERE
    a.appointment_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY
    a.clinic_id, a.appointment_date
ORDER BY
    a.clinic_id, a.appointment_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mat_view_daily_clinic_metrics ON clinic.mat_view_daily_clinic_metrics (clinic_id, appointment_date);

-- Note: To refresh this view, run: REFRESH MATERIALIZED VIEW CONCURRENTLY clinic.mat_view_daily_clinic_metrics;

```

# database/migrations/016_jobs_table.sql
```sql
-- database/migrations/016_jobs_table.sql
-- ============================================================================
-- Phase 6: Migration 016 - Jobs Table
-- Description: Creates a table to serve as a simple, database-backed job queue.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id BIGSERIAL PRIMARY KEY,
    queue TEXT NOT NULL DEFAULT 'default',
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the job processor to efficiently find pending jobs.
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON public.jobs (queue, status, run_at) WHERE status = 'pending';

-- Apply the `updated_at` trigger
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```

# database/migrations/017_health_screening_tables.sql
```sql
-- database/migrations/017_health_screening_tables.sql
-- ============================================================================
-- Phase 7: Migration 017 - Health Screening Tables
-- Description: Adds tables for managing health screening packages and results.
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic.health_screening_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinic.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    tests_included JSONB DEFAULT '[]', -- e.g., ["Fasting Glucose", "Lipid Panel"]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic.health_screening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES clinic.patients(id) ON DELETE CASCADE,
    package_id UUID REFERENCES clinic.health_screening_packages(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES clinic.appointments(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    doctor_notes TEXT,
    results JSONB NOT NULL, -- e.g., [{"test": "Fasting Glucose", "value": "5.2", "unit": "mmol/L", "range": "3.9-5.5"}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_screening_results_patient ON clinic.health_screening_results(patient_id);

```

# database/migrations/018_feedback_table.sql
```sql
-- database/migrations/018_feedback_table.sql
-- ============================================================================
-- Phase 10: Migration 018 - User Feedback Table
-- Description: Creates a table to store feedback submitted via the in-app widget.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying feedback by user or over time.
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at);

```

# database/seeds/001_system_seed.sql
```sql
-- database/seeds/001_system_seed.sql

-- ============================================================================
-- Phase 3: Seed 001 - System Seed
-- Description: Populates essential, environment-agnostic system data.
--              THIS SCRIPT IS SAFE AND INTENDED TO RUN IN PRODUCTION.
-- ============================================================================

SET search_path TO clinic, public;

-- ============================================================================
-- Feature Flags
-- Seeding default feature flags. These can be toggled in the admin UI.
-- ============================================================================

INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
    ('telemedicine', 'Enables video consultations for patients and doctors.', true),
    ('online_payments', 'Enables online payment processing via Stripe.', true),
    ('whatsapp_notifications', 'Enables sending appointment reminders via WhatsApp.', true),
    ('e_prescriptions', 'Enables generating and sending electronic prescriptions.', true),
    ('ai_diagnosis_suggestions', 'Provides AI-powered diagnosis suggestions to doctors during consultation.', false),
    ('patient_document_upload', 'Allows patients to upload their own documents (e.g., old lab results).', false)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;


-- ============================================================================
-- System Settings
-- Seeding global (NULL clinic_id) default settings for the application.
-- These can be overridden on a per-clinic basis in the admin UI.
-- ============================================================================

INSERT INTO system_settings (clinic_id, category, key, value, description) VALUES
    (NULL, 'appointment', 'default_duration_minutes', '15', 'Default appointment duration in minutes.'),
    (NULL, 'appointment', 'max_advance_booking_days', '90', 'Maximum number of days in advance a patient can book.'),
    (NULL, 'appointment', 'reminder_hours_before', '24', 'Hours before an appointment to send the first reminder.'),
    (NULL, 'payment', 'gst_rate', '0.09', 'Goods and Services Tax rate (e.g., 0.09 for 9%).'),
    (NULL, 'payment', 'currency', '"SGD"', 'Default currency for all transactions.'),
    (NULL, 'notification', 'sms_provider', '"twilio"', 'The default provider for sending SMS.'),
    (NULL, 'notification', 'email_provider', '"resend"', 'The default provider for sending emails.'),
    (NULL, 'telemedicine', 'video_provider', '"daily_co"', 'The default provider for video consultations.')
ON CONFLICT (clinic_id, category, key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

```

# database/seeds/002_dev_seed.sql
```sql
-- database/seeds/002_dev_seed.sql

-- ============================================================================
-- Phase 3: Seed 002 - Development Seed
-- Description: Populates the database with sample data for local development.
--              !!! WARNING: DO NOT RUN THIS SCRIPT IN PRODUCTION !!!
-- ============================================================================

DO $$
BEGIN
    IF (SELECT current_setting('app.environment', true)) <> 'development' AND (SELECT current_setting('app.environment', true)) <> 'test' THEN
        RAISE EXCEPTION 'This seed script is for development/test environments only and cannot be run in "%"', current_setting('app.environment', true);
    END IF;
END $$;

SET search_path TO clinic, public;

-- ============================================================================
-- Create Sample Clinic and Users
-- ============================================================================
DECLARE
    v_clinic_id UUID;
    v_admin_user_id UUID;
    v_doctor_user_id UUID;
    v_patient_user_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_appointment_id UUID;
    v_medical_record_id UUID;
    v_password_hash TEXT;
BEGIN
    -- 1. Create a sample clinic
    INSERT INTO clinics (code, name, registration_number, address, postal_code, phone, email, operating_hours)
    VALUES ('GFC-TP', 'Gabriel Family Clinic (Tampines)', 'GFC-2024-001', '123 Tampines Street 45, #01-67', '520123', '+6562345678', 'tampines@gabrielclinic.sg',
            '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": "closed"}')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_clinic_id;

    -- Generate a password hash for 'Demo123!' (for demonstration purposes)
    -- In a real scenario, this would be handled by the application's auth service.
    v_password_hash := '$2a$10$f.2T4r3z/8u/M/6X.i5p.O/9B5d.c.y3.C7b8.z/7a9/2e1.d.f';

    -- 2. Create a Superadmin User
    INSERT INTO users (clinic_id, email, password_hash, full_name, role, is_active, is_verified)
    VALUES (v_clinic_id, 'admin@demo.com', v_password_hash, 'System Administrator', 'superadmin', true, true)
    ON CONFLICT (clinic_id, email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id INTO v_admin_user_id;

    -- 3. Create a Doctor User and Profile
    INSERT INTO users (clinic_id, email, password_hash, full_name, role, is_active, is_verified)
    VALUES (v_clinic_id, 'doctor.tan@demo.com', v_password_hash, 'Dr. Tan Wei Ming', 'doctor', true, true)
    ON CONFLICT (clinic_id, email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id INTO v_doctor_user_id;

    INSERT INTO doctors (user_id, clinic_id, employee_id, medical_registration_number, license_expiry, specializations, consultation_fee)
    VALUES (v_doctor_user_id, v_clinic_id, 'EMP-DOC-001', 'MCR12345Z', '2026-12-31', '["Family Medicine", "Geriatrics"]', 50.00)
    ON CONFLICT (user_id) DO UPDATE SET medical_registration_number = EXCLUDED.medical_registration_number RETURNING id INTO v_doctor_id;

    -- 4. Create a Patient User and Profile
    INSERT INTO users (clinic_id, email, password_hash, full_name, role, is_active, is_verified, phone)
    VALUES (v_clinic_id, 'patient.lim@demo.com', v_password_hash, 'Lim Mei Ling', 'patient', true, true, '+6591234567')
    ON CONFLICT (clinic_id, email) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id INTO v_patient_user_id;

    INSERT INTO patients (user_id, clinic_id, patient_number, date_of_birth, gender, nric_hash, chas_card_type)
    VALUES (v_patient_user_id, v_clinic_id, 'P-2024-0001', '1985-05-15', 'female', 'hashed_nric_demo_12345', 'blue')
    ON CONFLICT (user_id) DO UPDATE SET patient_number = EXCLUDED.patient_number RETURNING id INTO v_patient_id;

    -- 5. Create a Sample Appointment
    INSERT INTO appointments (clinic_id, patient_id, doctor_id, appointment_number, appointment_date, appointment_time, status, appointment_type, visit_reason)
    VALUES (v_clinic_id, v_patient_id, v_doctor_id, clinic.generate_appointment_number('GFC-TP'), CURRENT_DATE, '10:30:00', 'completed', 'consultation', 'Follow-up for hypertension.')
    ON CONFLICT (appointment_number) DO NOTHING RETURNING id INTO v_appointment_id;

    -- 6. Create a Sample Medical Record for the Appointment
    IF v_appointment_id IS NOT NULL THEN
        INSERT INTO medical_records (clinic_id, patient_id, doctor_id, appointment_id, record_number, record_date, chief_complaint, primary_diagnosis, treatment_plan)
        VALUES (v_clinic_id, v_patient_id, v_doctor_id, v_appointment_id, 'MR-2024-0001', CURRENT_DATE, 'Headache and fatigue.', 'Benign essential hypertension', 'Continue Amlodipine 5mg OD. Monitor BP at home. Review in 1 month.')
        ON CONFLICT (appointment_id) DO NOTHING RETURNING id INTO v_medical_record_id;
    END IF;

    -- 7. Create a Sample Payment for the Appointment
    IF v_appointment_id IS NOT NULL THEN
        INSERT INTO payments (clinic_id, patient_id, appointment_id, payment_number, receipt_number, payment_date, payment_method, subtotal, chas_subsidy_amount, total_amount, paid_amount, status)
        VALUES (v_clinic_id, v_patient_id, v_appointment_id, 'PAY-2024-0001', 'REC-2024-0001', CURRENT_DATE, 'PayNow', 50.00, 18.50, 31.50, 31.50, 'completed')
        ON CONFLICT (payment_number) DO NOTHING;
    END IF;

    RAISE NOTICE 'Development seed data created successfully.';
END $$;

```

# public/manifest.json
```json
// public/manifest.json
{
  "name": "Gabriel Family Clinic",
  "short_name": "GFC v2.0",
  "description": "Your neighborhood family clinic, reimagined.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF6B6B",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

```

# scripts/database-maintenance.ts
```ts
// scripts/database-maintenance.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// This script should be run with a service role key
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMaintenance() {
  console.log("Starting database maintenance script...");

  // 1. VACUUM and ANALYZE frequently updated tables
  console.log("Running VACUUM ANALYZE on critical tables...");
  const tablesToMaintain = ["appointments", "jobs", "user_feedback"];
  for (const table of tablesToMaintain) {
    const { error } = await supabaseAdmin.rpc("vacuum_analyze_table", { table_name: table });
    if (error) console.error(`Failed to VACUUM ANALYZE ${table}:`, error);
  }

  // 2. Archive appointments older than 2 years
  console.log("Archiving old appointments...");
  const { error: archiveError } = await supabaseAdmin.rpc("archive_old_appointments");
  if (archiveError) console.error("Failed to archive old appointments:", archiveError);

  // 3. Clean up old, completed jobs from the job queue
  console.log("Cleaning up old jobs...");
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const { error: jobError } = await supabaseAdmin
    .from("jobs")
    .delete()
    .in("status", ["completed", "failed"])
    .lt("created_at", cutoffDate.toISOString());
  if (jobError) console.error("Failed to clean up old jobs:", jobError);

  console.log("Database maintenance script finished.");
}

runMaintenance().catch(console.error);

```

# tests/e2e/auth.spec.ts
```ts
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("should allow a patient to log in and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "patient.lim@demo.com"); // Using dev seed user
    await page.fill('input[name="password"]', "Demo123!");
    await page.click('button[type="submit"]');

    // Wait for the dashboard URL and check for a welcome message
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Your Health Dashboard")).toBeVisible();
  });

  test("should show an error for incorrect credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "patient.lim@demo.com");
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Expect an error message to be visible
    await expect(page.getByText("Invalid login credentials")).toBeVisible();
    // Expect the URL to remain on the login page
    expect(page.url()).toContain("/login");
  });

  test("should protect dashboard routes from unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    // Playwright will wait for the navigation, which should be a redirect
    await page.waitForURL("/login");
    await expect(page.getByText("Portal Login")).toBeVisible();
  });
});

```

# tests/load/stress-test.js
```js
// tests/load/stress-test.js
import http from "k6/http";
import { check, sleep } from "k6";

// Get the target URL from an environment variable, with a default for local testing
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Ramp up to 50 users over 1 minute
    { duration: "3m", target: 50 }, // Stay at 50 users for 3 minutes
    { duration: "1m", target: 100 },// Ramp up to 100 users over 1 minute
    { duration: "3m", target: 100 },// Stay at 100 users for 3 minutes
    { duration: "1m", target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    // 95% of requests should complete in under 500ms
    http_req_duration: ["p(95)<500"],
    // Less than 1% of requests should fail
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Test 1: Hit the public homepage
  const homeRes = http.get(BASE_URL);
  check(homeRes, {
    "Homepage is status 200": (r) => r.status === 200,
  });

  sleep(1);

  // Test 2: Hit the health check API endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "Health check is status 200": (r) => r.status === 200,
    "Health check responds with 'healthy'": (r) =>
      r.json("status") === "healthy",
  });

  sleep(1);
  
  // Test 3 (Example): Hit a public tRPC endpoint (health check)
  const trpcHealthRes = http.get(`${BASE_URL}/api/trpc/health`);
  check(trpcHealthRes, {
    "tRPC health check is status 200": (r) => r.status === 200,
  });

  sleep(1);
}

```

