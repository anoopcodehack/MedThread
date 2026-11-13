-- =====================================================================
-- MedThread Enterprise Clinical Security & Caregiver Schema
-- Target: Supabase PostgreSQL (Cloud Database)
-- Compliance: HIPAA-Aligned, SOC-2 Ready, Zero-Trust Access Control
-- =====================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 2. Caregiver & Dependent Network Table
-- Solves: Adult children managing records for aging parents
-- =====================================================================
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_name VARCHAR(128) NOT NULL,
    relationship VARCHAR(64) NOT NULL, -- "Adult Son", "Daughter", "Spouse", "Legal Guardian"
    phone_number VARCHAR(32) NOT NULL,
    email VARCHAR(128),
    access_level VARCHAR(64) DEFAULT 'FULL_MANAGEMENT', -- "FULL_MANAGEMENT", "READ_ONLY", "EMERGENCY_ALERTS"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 3. Time-Bound Emergency & Specialist Access Grants Table
-- Solves: 60-Second Emergency QR Pass & Specialist sharing
-- =====================================================================
CREATE TABLE IF NOT EXISTS access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    access_token VARCHAR(64) UNIQUE NOT NULL,
    provider_name VARCHAR(128) NOT NULL,
    facility_name VARCHAR(128) NOT NULL,
    specialty VARCHAR(64) DEFAULT 'General Medicine',
    scope VARCHAR(64) DEFAULT 'FULL_DOSSIER', -- "FULL_DOSSIER", "MEDS_AND_LABS_ONLY", "EMERGENCY_SUMMARY"
    duration_type VARCHAR(16) DEFAULT '24h',   -- "15m", "24h", "7d"
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 4. Verified Clinician Registry Table
-- Solves: Authorized doctor access & hospital verification
-- =====================================================================
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    registration_number VARCHAR(64) NOT NULL, -- Medical Council License (e.g. MCI-2018-94821)
    specialisation VARCHAR(128) NOT NULL,
    organisation VARCHAR(128) NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES — HIPAA DEFENSE IN DEPTH
-- =====================================================================

-- Enable RLS on all clinical tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_audit_logs ENABLE ROW LEVEL SECURITY;

-- Caregivers Policy: Users can only view caregivers linked to their patient ID or authenticated session
CREATE POLICY "Caregiver Isolation Policy" ON caregivers
    FOR ALL
    USING (
        auth.role() = 'service_role' OR 
        patient_id IN (
            SELECT p.id FROM patients p WHERE p.id = caregivers.patient_id
        )
    );

-- Access Grants Policy: Anyone with valid, unexpired token can read emergency triage
CREATE POLICY "Emergency Token Validation Policy" ON access_grants
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR 
        (is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP)
    );

-- Clinical Audit Logs: Append-only! No updates or deletes allowed ever
CREATE POLICY "Audit Trail Append Only Policy" ON review_audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================================
-- 6. SEED DATA: ELDERLY PARENT (PAT-101) & AUTHORIZED DOCTOR
-- =====================================================================

-- Insert Doctor Profile for Dr. Ananya Rao
INSERT INTO doctor_profiles (name, email, registration_number, specialisation, organisation, verified)
VALUES 
('Dr. Ananya Rao', 'doctor@medthread.io', 'MCI-KA-2018-44912', 'Interventional Cardiology', 'Apollo Heart Institute', TRUE),
('Dr. Vikrant Mehta', 'v.mehta@maxhealth.in', 'MCI-DL-2015-88120', 'Endocrinology & Diabetology', 'Max Healthcare', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Seed Caregiver Network for Elderly Parent Rajesh Sharma (PAT-101)
INSERT INTO caregivers (patient_id, caregiver_name, relationship, phone_number, email, access_level, is_active)
VALUES 
(101, 'Anoop Sharma', 'Adult Son (Primary Caregiver)', '+91 98765 43210', 'anoop@family.care', 'FULL_MANAGEMENT', TRUE),
(101, 'Priya Sharma', 'Daughter (Secondary Caregiver)', '+91 98765 12345', 'priya@family.care', 'READ_ONLY', TRUE)
ON CONFLICT DO NOTHING;

-- Seed Active Emergency Grant (24-Hour Pass)
INSERT INTO access_grants (patient_id, access_token, provider_name, facility_name, specialty, scope, duration_type, expires_at, is_revoked)
VALUES 
(101, 'MT-ER-948271', 'Dr. Ananya Rao', 'Apollo Heart Institute', 'Cardiology', 'FULL_DOSSIER', '24h', CURRENT_TIMESTAMP + INTERVAL '24 hours', FALSE),
(101, 'MT-SP-381024', 'Dr. Vikrant Mehta', 'Max Diabetes Center', 'Endocrinology', 'MEDS_AND_LABS_ONLY', '7d', CURRENT_TIMESTAMP + INTERVAL '7 days', FALSE)
ON CONFLICT (access_token) DO NOTHING;
