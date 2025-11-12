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

-- Apply the `updated_at` trigger (idempotent for each table)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_medical_records_updated_at'
    ) THEN
        CREATE TRIGGER update_medical_records_updated_at
            BEFORE UPDATE ON medical_records
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_prescriptions_updated_at'
    ) THEN
        CREATE TRIGGER update_prescriptions_updated_at
            BEFORE UPDATE ON prescriptions
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_prescription_items_updated_at'
    ) THEN
        CREATE TRIGGER update_prescription_items_updated_at
            BEFORE UPDATE ON prescription_items
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_lab_results_updated_at'
    ) THEN
        CREATE TRIGGER update_lab_results_updated_at
            BEFORE UPDATE ON lab_results
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_imaging_results_updated_at'
    ) THEN
        CREATE TRIGGER update_imaging_results_updated_at
            BEFORE UPDATE ON imaging_results
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_vaccination_records_updated_at'
    ) THEN
        CREATE TRIGGER update_vaccination_records_updated_at
            BEFORE UPDATE ON vaccination_records
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;
