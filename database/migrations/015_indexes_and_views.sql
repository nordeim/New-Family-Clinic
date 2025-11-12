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
-- CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin (full_name gin_trgm_ops);\n-- Temporarily disabled: depends on full_name existing on patients. Re-enable once patients.full_name is introduced via a dedicated migration. -- For fuzzy name search
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
-- Assumes:
-- - patients.user_id references clinic.users.id
-- - users.full_name is present (added in 003_core_identity_tables)
CREATE OR REPLACE VIEW clinic.view_upcoming_appointments AS
SELECT
    a.id AS appointment_id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.appointment_type,
    p.id AS patient_id,
    COALESCE(p_user.full_name, p_user.display_name) AS patient_name,
    d.id AS doctor_id,
    COALESCE(d_user.full_name, d_user.display_name) AS doctor_name,
    c.id AS clinic_id,
    c.name AS clinic_name,
    c.branch_name AS clinic_branch
FROM
    clinic.appointments a
JOIN
    clinic.patients p ON a.patient_id = p.id
LEFT JOIN
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
