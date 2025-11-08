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
