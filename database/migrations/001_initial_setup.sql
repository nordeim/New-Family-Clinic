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
