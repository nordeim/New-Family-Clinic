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
