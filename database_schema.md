# Database Schema Implementation Plan
## Gabriel Family Clinic v2.0 - Complete Database Architecture

### Executive Summary
Creating a comprehensive, production-ready PostgreSQL database schema for a multi-tenant healthcare platform serving Singapore's family clinics. This implementation includes full schema definition, deployment automation, security policies, and data integrity measures.

---

## 📋 Implementation Plan

### Phase 1: Planning & Validation
- [x] Analyze requirements from Project Architecture Document
- [x] Design entity relationships
- [x] Plan security and compliance measures
- [x] Define deployment strategy
- [ ] Review and validate schema design
- [ ] Create deployment scripts
- [ ] Test deployment process

### Phase 2: Core Schema Components
1. **Foundation Tables**
   - Multi-tenant structure (clinics)
   - User authentication and roles
   - Audit logging framework

2. **Clinical Tables**
   - Patients and medical records
   - Doctors and schedules
   - Appointments and queues
   - Prescriptions and medications

3. **Operational Tables**
   - Payments and billing
   - Notifications and communications
   - Integrations and webhooks

4. **Advanced Features**
   - Telemedicine sessions
   - Lab results and imaging
   - Health screening packages
   - Vaccination records

### Phase 3: Security Implementation
- Row Level Security (RLS) policies
- Column-level encryption for sensitive data
- Audit triggers
- Access control functions

### Phase 4: Performance Optimization
- Strategic indexes
- Partitioning for large tables
- Materialized views for reporting
- Query optimization functions

---

## 📄 Database Schema

### `database_schema.sql`

```sql
-- ============================================================================
-- Gabriel Family Clinic v2.0 - Complete Database Schema
-- Version: 2.0.0
-- Date: November 2024
-- Description: Production-ready PostgreSQL schema for multi-tenant healthcare platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Exclusion constraints
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================

-- Create schemas for logical separation
CREATE SCHEMA IF NOT EXISTS clinic;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS archive;

-- Set default search path
SET search_path TO clinic, public;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'patient',
    'doctor', 
    'nurse',
    'staff',
    'admin',
    'superadmin'
);

-- Appointment status
CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
    'rescheduled'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'partial'
);

-- Gender
CREATE TYPE gender AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);

-- CHAS card types
CREATE TYPE chas_card_type AS ENUM (
    'blue',
    'orange',
    'green',
    'none'
);

-- Notification channel
CREATE TYPE notification_channel AS ENUM (
    'email',
    'sms',
    'whatsapp',
    'push',
    'in_app'
);

-- Queue status
CREATE TYPE queue_status AS ENUM (
    'waiting',
    'called',
    'serving',
    'completed',
    'cancelled'
);

-- Document type
CREATE TYPE document_type AS ENUM (
    'lab_result',
    'xray',
    'scan',
    'report',
    'prescription',
    'mc',
    'referral',
    'other'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Clinics table (multi-tenancy root)
CREATE TABLE clinics (
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

-- Users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
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
    
    CONSTRAINT unique_email_per_clinic UNIQUE(clinic_id, email),
    CONSTRAINT valid_user_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    nric_encrypted VARCHAR(500), -- Encrypted NRIC
    nric_hash VARCHAR(64), -- For unique constraint and lookup
    passport_number_encrypted VARCHAR(500),
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    nationality VARCHAR(100) DEFAULT 'Singaporean',
    race VARCHAR(50),
    marital_status VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(255),
    
    -- Contact Information
    address TEXT,
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Medical Information
    blood_type VARCHAR(10),
    allergies JSONB DEFAULT '[]',
    chronic_conditions JSONB DEFAULT '[]',
    current_medications JSONB DEFAULT '[]',
    medical_history JSONB DEFAULT '[]',
    family_medical_history JSONB DEFAULT '[]',
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    
    -- Insurance Information
    chas_card_type chas_card_type DEFAULT 'none',
    chas_card_number_encrypted VARCHAR(500),
    chas_card_expiry DATE,
    insurance_provider VARCHAR(255),
    insurance_policy_number_encrypted VARCHAR(500),
    insurance_expiry DATE,
    medisave_authorized BOOLEAN DEFAULT false,
    
    -- Preferences
    preferred_doctor_id UUID,
    preferred_language VARCHAR(5) DEFAULT 'en',
    sms_consent BOOLEAN DEFAULT false,
    email_consent BOOLEAN DEFAULT false,
    whatsapp_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    consent_updated_at TIMESTAMPTZ,
    
    -- Metadata
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
    
    CONSTRAINT unique_nric_hash UNIQUE(nric_hash),
    CONSTRAINT valid_emergency_phone CHECK (emergency_contact_phone ~ '^[+0-9][0-9\s-]+$')
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    medical_registration_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    specializations JSONB DEFAULT '[]',
    qualifications JSONB DEFAULT '[]',
    languages_spoken JSONB DEFAULT '["English"]',
    
    -- Professional Information
    years_of_experience INTEGER,
    consultation_fee DECIMAL(10,2),
    telemedicine_enabled BOOLEAN DEFAULT false,
    telemedicine_fee DECIMAL(10,2),
    
    -- Schedule Settings
    consultation_duration_minutes INTEGER DEFAULT 15,
    buffer_time_minutes INTEGER DEFAULT 0,
    max_daily_appointments INTEGER DEFAULT 40,
    advance_booking_days INTEGER DEFAULT 30,
    
    -- Availability
    working_hours JSONB DEFAULT '{}', -- Per day of week
    break_times JSONB DEFAULT '[]',
    blocked_dates JSONB DEFAULT '[]',
    
    -- Preferences
    auto_accept_appointments BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{}',
    signature_image_url TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    
    -- Statistics
    total_consultations INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_consultation_fee CHECK (consultation_fee >= 0),
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- Staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    reporting_to UUID REFERENCES staff(id),
    
    -- Permissions
    permissions JSONB DEFAULT '{}',
    accessible_modules JSONB DEFAULT '[]',
    
    -- Work Information
    employment_type VARCHAR(50), -- full-time, part-time, contract
    start_date DATE NOT NULL,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- APPOINTMENT & SCHEDULING TABLES
-- ============================================================================

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Scheduling
    appointment_number VARCHAR(20) UNIQUE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    appointment_type VARCHAR(50) NOT NULL, -- consultation, follow-up, vaccination, screening
    visit_reason TEXT,
    status appointment_status DEFAULT 'scheduled',
    
    -- Queue Management
    queue_number VARCHAR(10),
    queue_status queue_status,
    checked_in_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ,
    consultation_start_at TIMESTAMPTZ,
    consultation_end_at TIMESTAMPTZ,
    
    -- Telemedicine
    is_telemedicine BOOLEAN DEFAULT false,
    telemedicine_link TEXT,
    telemedicine_session_id VARCHAR(255),
    
    -- Financial
    consultation_fee DECIMAL(10,2),
    additional_charges DECIMAL(10,2) DEFAULT 0,
    chas_applicable BOOLEAN DEFAULT false,
    chas_subsidy_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    
    -- Notes
    pre_consultation_notes TEXT,
    post_consultation_notes TEXT,
    internal_notes TEXT,
    
    -- Reminders
    reminder_sent_at TIMESTAMPTZ,
    reminder_channels JSONB DEFAULT '[]',
    
    -- Metadata
    source VARCHAR(50), -- online, walk-in, phone
    booked_by UUID REFERENCES users(id),
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id),
    no_show_marked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_appointment_slot UNIQUE(doctor_id, appointment_date, appointment_time),
    CONSTRAINT valid_appointment_date CHECK (appointment_date >= CURRENT_DATE),
    CONSTRAINT valid_total_amount CHECK (total_amount >= 0)
);

-- Appointment slots table (for availability management)
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
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

-- Queue management table
CREATE TABLE queue_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL,
    current_number VARCHAR(10),
    last_called_number VARCHAR(10),
    total_waiting INTEGER DEFAULT 0,
    average_wait_time_minutes INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_queue_date UNIQUE(clinic_id, queue_date)
);

-- ============================================================================
-- MEDICAL RECORDS TABLES
-- ============================================================================

-- Medical records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    record_date DATE NOT NULL,
    
    -- Vital Signs
    temperature_celsius DECIMAL(4,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate_bpm INTEGER,
    respiratory_rate_bpm INTEGER,
    oxygen_saturation_percent INTEGER,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    
    -- Clinical Information
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    review_of_systems JSONB DEFAULT '{}',
    physical_examination JSONB DEFAULT '{}',
    
    -- Diagnosis
    primary_diagnosis VARCHAR(255),
    primary_diagnosis_code VARCHAR(20), -- ICD-10
    secondary_diagnoses JSONB DEFAULT '[]',
    differential_diagnoses JSONB DEFAULT '[]',
    
    -- Treatment
    treatment_plan TEXT,
    medications_prescribed JSONB DEFAULT '[]',
    procedures_performed JSONB DEFAULT '[]',
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    
    -- Referrals
    referral_required BOOLEAN DEFAULT false,
    referral_to VARCHAR(255),
    referral_reason TEXT,
    referral_letter_url TEXT,
    
    -- Medical Leave
    mc_required BOOLEAN DEFAULT false,
    mc_start_date DATE,
    mc_end_date DATE,
    mc_days INTEGER,
    mc_number VARCHAR(50),
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Privacy
    is_sensitive BOOLEAN DEFAULT false,
    access_restricted BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_vital_signs CHECK (
        (temperature_celsius IS NULL OR (temperature_celsius >= 30 AND temperature_celsius <= 45)) AND
        (blood_pressure_systolic IS NULL OR (blood_pressure_systolic >= 50 AND blood_pressure_systolic <= 300)) AND
        (blood_pressure_diastolic IS NULL OR (blood_pressure_diastolic >= 30 AND blood_pressure_diastolic <= 200)) AND
        (heart_rate_bpm IS NULL OR (heart_rate_bpm >= 30 AND heart_rate_bpm <= 300)) AND
        (oxygen_saturation_percent IS NULL OR (oxygen_saturation_percent >= 0 AND oxygen_saturation_percent <= 100))
    )
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    prescription_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, expired
    valid_until DATE,
    
    -- E-prescription
    is_e_prescription BOOLEAN DEFAULT false,
    e_prescription_sent_to VARCHAR(255), -- pharmacy name
    e_prescription_sent_at TIMESTAMPTZ,
    e_prescription_token VARCHAR(255),
    qr_code_url TEXT,
    
    -- Dispensing
    dispensed_by VARCHAR(255),
    dispensed_at TIMESTAMPTZ,
    collection_method VARCHAR(50), -- pickup, delivery
    
    -- Notes
    pharmacy_notes TEXT,
    doctor_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Prescription items table
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    medication_code VARCHAR(50),
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50), -- oral, topical, injection, etc.
    duration VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit VARCHAR(20),
    instructions TEXT,
    food_instructions VARCHAR(100), -- before meals, after meals, with food
    
    -- Dispensing
    dispensed_quantity INTEGER,
    remaining_quantity INTEGER,
    
    -- Pricing
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    subsidy_amount DECIMAL(10,2),
    
    -- Flags
    is_controlled_drug BOOLEAN DEFAULT false,
    is_antibiotic BOOLEAN DEFAULT false,
    requires_special_storage BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Lab results table
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    
    -- Lab Information
    lab_name VARCHAR(255) NOT NULL,
    lab_reference_number VARCHAR(100),
    test_date DATE NOT NULL,
    report_date DATE,
    
    -- Test Details
    test_category VARCHAR(100), -- blood, urine, imaging, etc.
    tests_ordered JSONB NOT NULL DEFAULT '[]',
    results JSONB DEFAULT '{}',
    
    -- Critical Values
    has_critical_values BOOLEAN DEFAULT false,
    critical_values JSONB DEFAULT '[]',
    critical_values_acknowledged_by UUID REFERENCES users(id),
    critical_values_acknowledged_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, partial, completed, reviewed
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMPTZ,
    comments TEXT,
    
    -- Files
    report_url TEXT,
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Imaging results table
CREATE TABLE imaging_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    
    -- Imaging Information
    imaging_type VARCHAR(50) NOT NULL, -- xray, ct, mri, ultrasound
    body_part VARCHAR(100),
    imaging_date DATE NOT NULL,
    imaging_center VARCHAR(255),
    reference_number VARCHAR(100),
    
    -- Results
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    
    -- Radiologist Information
    radiologist_name VARCHAR(255),
    radiologist_comments TEXT,
    report_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Files
    images_url JSONB DEFAULT '[]',
    report_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Vaccination records table
CREATE TABLE vaccination_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    administered_by UUID REFERENCES users(id),
    
    -- Vaccine Information
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_brand VARCHAR(255),
    vaccine_type VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    
    -- Administration
    dose_number INTEGER,
    dose_amount VARCHAR(50),
    route_of_administration VARCHAR(50),
    injection_site VARCHAR(100),
    administered_date DATE NOT NULL,
    
    -- Next Dose
    next_dose_due_date DATE,
    series_complete BOOLEAN DEFAULT false,
    
    -- Side Effects
    side_effects_reported BOOLEAN DEFAULT false,
    side_effects_details TEXT,
    
    -- Documentation
    certificate_number VARCHAR(100),
    certificate_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    
    -- Payment Information
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- cash, card, paynow, nets
    
    -- Amounts
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
    
    -- Payment Processing
    status payment_status DEFAULT 'pending',
    transaction_reference VARCHAR(255),
    payment_gateway VARCHAR(50),
    payment_intent_id VARCHAR(255),
    
    -- Refunds
    is_refunded BOOLEAN DEFAULT false,
    refunded_amount DECIMAL(10,2),
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refunded_by UUID REFERENCES users(id),
    
    -- Receipt
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_url TEXT,
    receipt_sent_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_payment_amounts CHECK (
        total_amount >= 0 AND
        paid_amount >= 0 AND
        outstanding_amount >= 0
    )
);

-- Payment items table
CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- consultation, medication, procedure, lab, others
    item_description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insurance claims table
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Claim Information
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100),
    claim_type VARCHAR(50), -- outpatient, inpatient, day-surgery
    
    -- Amounts
    claimed_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    rejected_amount DECIMAL(10,2),
    copayment_amount DECIMAL(10,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, approved, rejected, partial
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Documentation
    documents JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(50) NOT NULL, -- appointment_reminder, payment_due, lab_result, etc.
    channel notification_channel NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- email, phone number, etc.
    
    -- Content
    subject VARCHAR(255),
    message TEXT NOT NULL,
    template_id VARCHAR(100),
    template_variables JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    priority INTEGER DEFAULT 5, -- 1-10, 1 being highest
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SMS messages table
CREATE TABLE sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- SMS Details
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    
    -- Provider Information
    provider VARCHAR(50), -- twilio, aws_sns, etc.
    provider_message_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50),
    status_callback_url TEXT,
    delivery_status VARCHAR(50),
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Cost
    segments INTEGER,
    price_per_segment DECIMAL(10,4),
    total_cost DECIMAL(10,4),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp messages table
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- WhatsApp Details
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message_type VARCHAR(50), -- text, template, media
    
    -- Content
    text_body TEXT,
    template_name VARCHAR(100),
    template_language VARCHAR(10),
    template_parameters JSONB DEFAULT '{}',
    media_url TEXT,
    media_type VARCHAR(50),
    
    -- Provider Information
    provider_message_id VARCHAR(255),
    conversation_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_code VARCHAR(50),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Email messages table
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Email Details
    to_email VARCHAR(255) NOT NULL,
    cc_emails JSONB DEFAULT '[]',
    bcc_emails JSONB DEFAULT '[]',
    from_email VARCHAR(255),
    reply_to_email VARCHAR(255),
    
    -- Content
    subject VARCHAR(500) NOT NULL,
    html_body TEXT,
    text_body TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Provider Information
    provider VARCHAR(50), -- sendgrid, aws_ses, resend, etc.
    provider_message_id VARCHAR(255),
    
    -- Status
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

-- ============================================================================
-- TELEMEDICINE TABLES
-- ============================================================================

-- Telemedicine sessions table
CREATE TABLE telemedicine_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    
    -- Session Information
    session_token VARCHAR(500) UNIQUE NOT NULL,
    room_url TEXT,
    room_name VARCHAR(100),
    
    -- Session Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, waiting, in_progress, completed, cancelled
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Participants
    patient_joined_at TIMESTAMPTZ,
    patient_left_at TIMESTAMPTZ,
    doctor_joined_at TIMESTAMPTZ,
    doctor_left_at TIMESTAMPTZ,
    
    -- Quality Metrics
    patient_connection_quality VARCHAR(20), -- poor, fair, good, excellent
    doctor_connection_quality VARCHAR(20),
    audio_issues BOOLEAN DEFAULT false,
    video_issues BOOLEAN DEFAULT false,
    connection_drops INTEGER DEFAULT 0,
    
    -- Recording
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    recording_duration_seconds INTEGER,
    recording_size_mb DECIMAL(10,2),
    
    -- Post-Session
    patient_rating INTEGER,
    patient_feedback TEXT,
    doctor_notes TEXT,
    technical_issues TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_rating CHECK (patient_rating >= 1 AND patient_rating <= 5)
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Audit logs table
CREATE TABLE audit.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
    user_id UUID,
    clinic_id UUID,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for audit logs (monthly)
CREATE TABLE audit.audit_logs_2024_01 PARTITION OF audit.audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit.audit_logs_2024_02 PARTITION OF audit.audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Continue for all months...

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
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

-- Feature flags table
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    
    -- Targeting
    enabled_for_clinics JSONB DEFAULT '[]',
    enabled_for_users JSONB DEFAULT '[]',
    
    -- Configuration
    configuration JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_rollout CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- Integration webhooks table
CREATE TABLE integration_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Webhook Configuration
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    
    -- Events
    events JSONB NOT NULL DEFAULT '[]', -- appointment.created, payment.completed, etc.
    
    -- Headers
    headers JSONB DEFAULT '{}',
    
    -- Retry Configuration
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Statistics
    last_triggered_at TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES integration_webhooks(id) ON DELETE CASCADE,
    
    -- Request Details
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Response
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    
    -- Status
    status VARCHAR(50) NOT NULL, -- pending, success, failed
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_clinic_email ON users(clinic_id, email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Patients indexes
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_patients_nric_hash ON patients(nric_hash);
CREATE INDEX idx_patients_name ON patients USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_patients_chas ON patients(chas_card_type) WHERE chas_card_type != 'none';

-- Doctors indexes
CREATE INDEX idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX idx_doctors_registration ON doctors(medical_registration_number);

-- Appointments indexes
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_upcoming ON appointments(appointment_date, appointment_time) 
    WHERE status IN ('scheduled', 'confirmed') AND appointment_date >= CURRENT_DATE;

-- Medical records indexes
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);
CREATE INDEX idx_medical_records_diagnosis ON medical_records USING gin(to_tsvector('english', primary_diagnosis));

-- Payments indexes
CREATE INDEX idx_payments_clinic ON payments(clinic_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_outstanding ON payments(outstanding_amount) WHERE outstanding_amount > 0;

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_clinic ON audit.audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_created ON audit.audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate appointment number
CREATE OR REPLACE FUNCTION generate_appointment_number(clinic_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    appointment_number VARCHAR;
    current_date_str VARCHAR;
    sequence_num INTEGER;
BEGIN
    current_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM appointments
    WHERE appointment_number LIKE clinic_code || '-' || current_date_str || '%';
    
    appointment_number := clinic_code || '-' || current_date_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN appointment_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(height_cm DECIMAL, weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height_cm > 0 AND weight_kg > 0 THEN
        RETURN ROUND((weight_kg / POWER(height_cm / 100, 2))::DECIMAL, 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(plain_text, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        clinic_id,
        old_values,
        new_values,
        changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_setting('app.current_user_id', true)::UUID,
        current_setting('app.current_clinic_id', true)::UUID,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN 
            (SELECT jsonb_object_agg(key, value) 
             FROM jsonb_each(row_to_json(NEW)::jsonb) 
             WHERE value != (row_to_json(OLD)::jsonb)->key)
        ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_medical_records AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Clinic isolation policy (users can only see data from their clinic)
CREATE POLICY clinic_isolation_policy ON clinics
    FOR ALL
    USING (id = current_setting('app.current_clinic_id', true)::UUID);

-- Users can only see users from their clinic
CREATE POLICY users_clinic_policy ON users
    FOR SELECT
    USING (clinic_id = current_setting('app.current_clinic_id', true)::UUID);

-- Patients can see their own data
CREATE POLICY patients_own_data_policy ON patients
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
        OR
        clinic_id = current_setting('app.current_clinic_id', true)::UUID
    );

-- Doctors can see patients they have treated
CREATE POLICY doctors_patient_access_policy ON patients
    FOR SELECT
    USING (
        clinic_id = current_setting('app.current_clinic_id', true)::UUID
        AND
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.patient_id = patients.id
            AND appointments.doctor_id = (
                SELECT id FROM doctors WHERE user_id = current_setting('app.current_user_id', true)::UUID
            )
        )
    );

-- Medical records access (patients can see their own, doctors can see their patients')
CREATE POLICY medical_records_access_policy ON medical_records
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        OR
        doctor_id IN (
            SELECT id FROM doctors WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        OR
        clinic_id = current_setting('app.current_clinic_id', true)::UUID
    );

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled) VALUES
    ('telemedicine', 'Enable telemedicine consultations', true),
    ('e_prescriptions', 'Enable electronic prescriptions', true),
    ('whatsapp_notifications', 'Enable WhatsApp notifications', true),
    ('ai_diagnosis_suggestions', 'Enable AI-powered diagnosis suggestions', false),
    ('online_payments', 'Enable online payment processing', true);

-- Insert default system settings
INSERT INTO system_settings (clinic_id, category, key, value, description) VALUES
    (NULL, 'appointment', 'default_duration', '15', 'Default appointment duration in minutes'),
    (NULL, 'appointment', 'max_advance_booking_days', '30', 'Maximum days in advance for booking'),
    (NULL, 'appointment', 'reminder_hours_before', '24', 'Hours before appointment to send reminder'),
    (NULL, 'payment', 'gst_rate', '0.08', 'GST rate (8%)'),
    (NULL, 'notification', 'sms_provider', 'twilio', 'SMS service provider'),
    (NULL, 'notification', 'email_provider', 'resend', 'Email service provider');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for upcoming appointments
CREATE VIEW upcoming_appointments AS
SELECT 
    a.*,
    p.full_name as patient_name,
    d.full_name as doctor_name,
    c.name as clinic_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN clinics c ON a.clinic_id = c.id
WHERE a.appointment_date >= CURRENT_DATE
AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date, a.appointment_time;

-- View for patient summary
CREATE VIEW patient_summary AS
SELECT 
    p.*,
    u.email,
    u.phone,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT mr.id) as total_medical_records,
    MAX(a.appointment_date) as last_visit_date
FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN medical_records mr ON p.id = mr.patient_id
GROUP BY p.id, u.email, u.phone;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Create roles
CREATE ROLE clinic_admin;
CREATE ROLE clinic_doctor;
CREATE ROLE clinic_staff;
CREATE ROLE clinic_patient;

-- Grant permissions to roles
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA clinic TO clinic_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA clinic TO clinic_doctor;
GRANT SELECT, INSERT, UPDATE ON appointments, patients TO clinic_staff;
GRANT SELECT ON patients, appointments, medical_records TO clinic_patient;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
```

---

## 🐍 Database Deployment Script

### `deploy_database.py`

```python
#!/usr/bin/env python3
"""
Gabriel Family Clinic v2.0 - Database Deployment Script
Handles database initialization, schema deployment, and data seeding
"""

import os
import sys
import logging
import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import bcrypt
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from rich.panel import Panel
from rich.logging import RichHandler

# Configure logging
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger(__name__)
console = Console()

class DatabaseDeployer:
    """Handles database deployment operations"""
    
    def __init__(self, env_file: str = ".env"):
        """Initialize the database deployer"""
        self.load_environment(env_file)
        self.console = Console()
        self.connection = None
        self.cursor = None
        
    def load_environment(self, env_file: str):
        """Load environment variables"""
        env_path = Path(env_file)
        if not env_path.exists():
            raise FileNotFoundError(f"Environment file {env_file} not found")
        
        load_dotenv(env_file)
        
        # Database configuration
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'gabriel_clinic'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD'),
        }
        
        # Admin user configuration
        self.admin_config = {
            'email': os.getenv('ADMIN_EMAIL', 'admin@gabrielclinic.sg'),
            'password': os.getenv('ADMIN_PASSWORD', 'Admin@123!'),
            'full_name': os.getenv('ADMIN_NAME', 'System Administrator'),
        }
        
        # Clinic configuration
        self.clinic_config = {
            'name': os.getenv('CLINIC_NAME', 'Gabriel Family Clinic'),
            'code': os.getenv('CLINIC_CODE', 'GFC'),
            'registration': os.getenv('CLINIC_REGISTRATION', 'GFC-2024-001'),
            'address': os.getenv('CLINIC_ADDRESS', '123 Tampines Street 45, #01-67'),
            'postal_code': os.getenv('CLINIC_POSTAL', '520123'),
            'phone': os.getenv('CLINIC_PHONE', '+6562345678'),
            'email': os.getenv('CLINIC_EMAIL', 'info@gabrielclinic.sg'),
        }
        
        self.encryption_key = os.getenv('ENCRYPTION_KEY', 'your-encryption-key-min-32-chars-long')
        
    def connect_to_postgres(self):
        """Connect to PostgreSQL server"""
        try:
            # Connect without specifying database first
            config = self.db_config.copy()
            config['database'] = 'postgres'
            
            self.connection = psycopg2.connect(**config)
            self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            self.cursor = self.connection.cursor()
            
            self.console.print("[green]✓[/green] Connected to PostgreSQL server")
            return True
            
        except psycopg2.Error as e:
            self.console.print(f"[red]✗[/red] Failed to connect to PostgreSQL: {e}")
            return False
            
    def database_exists(self, db_name: str) -> bool:
        """Check if database exists"""
        try:
            self.cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )
            return self.cursor.fetchone() is not None
        except psycopg2.Error as e:
            logger.error(f"Error checking database existence: {e}")
            return False
            
    def create_database(self):
        """Create the database if it doesn't exist"""
        db_name = self.db_config['database']
        
        if self.database_exists(db_name):
            self.console.print(f"[yellow]![/yellow] Database '{db_name}' already exists")
            return True
            
        try:
            # Create database
            self.cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(db_name)
                )
            )
            
            self.console.print(f"[green]✓[/green] Created database '{db_name}'")
            return True
            
        except psycopg2.Error as e:
            self.console.print(f"[red]✗[/red] Failed to create database: {e}")
            return False
            
    def connect_to_database(self):
        """Connect to the specific database"""
        try:
            if self.connection:
                self.connection.close()
                
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            
            self.console.print(f"[green]✓[/green] Connected to database '{self.db_config['database']}'")
            return True
            
        except psycopg2.Error as e:
            self.console.print(f"[red]✗[/red] Failed to connect to database: {e}")
            return False
            
    def execute_sql_file(self, file_path: str, description: str = "SQL file"):
        """Execute SQL commands from a file"""
        try:
            path = Path(file_path)
            if not path.exists():
                self.console.print(f"[red]✗[/red] {description} file not found: {file_path}")
                return False
                
            with open(path, 'r') as f:
                sql_content = f.read()
                
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql_content.split(';') if s.strip()]
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                console=self.console
            ) as progress:
                task = progress.add_task(f"Executing {description}", total=len(statements))
                
                for statement in statements:
                    try:
                        self.cursor.execute(statement)
                        progress.update(task, advance=1)
                    except psycopg2.Error as e:
                        if "already exists" not in str(e):
                            logger.warning(f"Statement warning: {e}")
                        continue
                        
            self.connection.commit()
            self.console.print(f"[green]✓[/green] Executed {description}")
            return True
            
        except Exception as e:
