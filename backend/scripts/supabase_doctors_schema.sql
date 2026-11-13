-- =====================================================================
-- MedThread Doctor Registry Schema for Supabase PostgreSQL
-- SOSC SYNERGIA 26 • Track: Distributed Systems & Clinical AI
-- Run this script in the Supabase SQL Editor: Dashboard -> SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    registration_number VARCHAR(64) NOT NULL, -- Medical Council License (e.g. MCI-KA-2018-44912)
    specialisation VARCHAR(128) NOT NULL,
    organisation VARCHAR(128) NOT NULL,
    department VARCHAR(128) DEFAULT 'Cardiology',
    queue_depth INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OVERLOADED', 'OFF_DUTY'
    phone VARCHAR(32) DEFAULT '+91 98765 43210',
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified doctors for specialist matching and dashboards
DROP POLICY IF EXISTS "Public Read Doctors" ON doctors;
CREATE POLICY "Public Read Doctors" ON doctors
    FOR SELECT
    USING (TRUE);

-- Allow updates (authenticated or via API key)
DROP POLICY IF EXISTS "Update Doctor Profile" ON doctors;
CREATE POLICY "Update Doctor Profile" ON doctors
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- Seed initial hospital-grade specialist doctors & emergency queue states
INSERT INTO doctors (id, name, email, registration_number, specialisation, organisation, department, queue_depth, status, verified)
VALUES
(1, 'Dr. Ananya Rao', 'doctor@medthread.io', 'MCI-KA-2018-44912', 'Cardiology', 'Apollo Heart Institute', 'Interventional Cardiology', 5, 'OVERLOADED', TRUE),
(2, 'Dr. Suresh Menon', 'suresh.menon@manipal.edu', 'MCI-KA-2016-19284', 'Cardiology', 'Manipal Hospital', 'Cardiology & Triage', 1, 'AVAILABLE', TRUE),
(3, 'Dr. Kavita Shenoy', 'kavita.shenoy@fortis.in', 'MCI-KA-2020-77192', 'Pulmonology', 'Fortis Hospital', 'Pulmonology & Critical Care', 2, 'AVAILABLE', TRUE),
(4, 'Dr. Vikrant Mehta', 'v.mehta@maxhealth.in', 'MCI-DL-2015-88120', 'Endocrinology', 'Max Healthcare', 'Endocrinology & Diabetology', 3, 'AVAILABLE', TRUE),
(5, 'Dr. Rajesh Iyer', 'r.iyer@aiims.edu', 'MCI-DL-2011-30911', 'Internal Medicine', 'AIIMS New Delhi', 'General & Internal Medicine', 0, 'AVAILABLE', TRUE)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    registration_number = EXCLUDED.registration_number,
    specialisation = EXCLUDED.specialisation,
    organisation = EXCLUDED.organisation,
    department = EXCLUDED.department,
    queue_depth = EXCLUDED.queue_depth,
    status = EXCLUDED.status,
    verified = EXCLUDED.verified,
    updated_at = CURRENT_TIMESTAMP;
