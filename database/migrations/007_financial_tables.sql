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

-- Apply the `updated_at` trigger (idempotent for each table)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at'
    ) THEN
        CREATE TRIGGER update_payments_updated_at
            BEFORE UPDATE ON payments
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_insurance_claims_updated_at'
    ) THEN
        CREATE TRIGGER update_insurance_claims_updated_at
            BEFORE UPDATE ON insurance_claims
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;
