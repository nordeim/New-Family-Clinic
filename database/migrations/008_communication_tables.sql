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
