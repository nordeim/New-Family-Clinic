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
    ('telemedicine', 'Enables video consultations for patients and doctors.', true, 100),
    ('online_payments', 'Enables online payment processing via Stripe.', true, 100),
    ('whatsapp_notifications', 'Enables sending appointment reminders via WhatsApp.', true, 100),
    ('e_prescriptions', 'Enables generating and sending electronic prescriptions.', true, 100),
    ('ai_diagnosis_suggestions', 'Provides AI-powered diagnosis suggestions to doctors during consultation.', false, 100),
    ('patient_document_upload', 'Allows patients to upload their own documents (e.g., old lab results).', false, 100)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_enabled = EXCLUDED.is_enabled,
    rollout_percentage = EXCLUDED.rollout_percentage;


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
