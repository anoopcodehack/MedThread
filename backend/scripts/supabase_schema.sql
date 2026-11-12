-- =====================================================================
-- MedThread Clinical Database Schema for Supabase PostgreSQL
-- SOSC SYNERGY 26 • Problem Statement PS-7 "One Patient, Many Records"
-- =====================================================================

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS review_audit_logs CASCADE;
DROP TABLE IF EXISTS contradictions CASCADE;
DROP TABLE IF EXISTS timeline_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- 1. Patients Registry
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    external_patient_id VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ingested Documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(256) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    document_type VARCHAR(64),
    ocr_applied INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Longitudinal Timeline Events (14 Required Audit Fields)
CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    raw_value VARCHAR(64),
    raw_unit VARCHAR(64),
    normalized_value VARCHAR(64),
    raw_date VARCHAR(64) NOT NULL,
    normalized_date VARCHAR(32) NOT NULL,
    date_status VARCHAR(32) DEFAULT 'CONFIDENT',
    source_doc VARCHAR(256) NOT NULL,
    page_number INTEGER DEFAULT 1,
    source_passage TEXT NOT NULL,
    is_reviewed INTEGER DEFAULT 0,
    reviewed_override TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 4-Tier Contradictions & Conflict Radar
CREATE TABLE contradictions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tier VARCHAR(64) NOT NULL, -- DIRECT_CONFLICT, NEEDS_REVIEW, DUPLICATE_INVESTIGATION, UPDATED
    category VARCHAR(64) NOT NULL,
    entity VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    doc1_name VARCHAR(256) NOT NULL,
    quote1 TEXT NOT NULL,
    doc2_name VARCHAR(256) NOT NULL,
    quote2 TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clinician Review Forensic Audit Logs
CREATE TABLE review_audit_logs (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(128) NOT NULL,
    field_modified VARCHAR(64) NOT NULL,
    original_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX idx_patients_ext ON patients(external_patient_id);
CREATE INDEX idx_documents_patient ON documents(patient_id);
CREATE INDEX idx_timeline_patient_date ON timeline_events(patient_id, normalized_date);
CREATE INDEX idx_contradictions_patient ON contradictions(patient_id);

-- =====================================================================
-- SEED INITIAL 5 BENCHMARK PATIENTS & DEMO CLINICAL FINDINGS
-- =====================================================================

INSERT INTO patients (id, external_patient_id, full_name) VALUES
(101, 'PAT-101', 'Rajesh Sharma'),
(102, 'PAT-102', 'Priya Patel'),
(103, 'PAT-103', 'Vikram Malhotra'),
(104, 'PAT-104', 'Mohammed Irfan'),
(105, 'PAT-105', 'David Fernandes');

-- Patient 101 Documents
INSERT INTO documents (id, patient_id, filename, file_path, file_size_bytes, file_type, document_type, ocr_applied) VALUES
(1, 101, '01_Prescription_2022.pdf', 'https://znwoerjmclnajtxhecek.supabase.co/storage/v1/object/public/patient-records/101/01_Prescription_2022.pdf', 3820, 'PDF', 'PRESCRIPTION', 0),
(2, 101, '02_Lab_Thyrocare_2023.pdf', 'https://znwoerjmclnajtxhecek.supabase.co/storage/v1/object/public/patient-records/101/02_Lab_Thyrocare_2023.pdf', 3740, 'PDF', 'LAB_REPORT', 0),
(3, 101, '03_Prescription_2023.pdf', 'https://znwoerjmclnajtxhecek.supabase.co/storage/v1/object/public/patient-records/101/03_Prescription_2023.pdf', 3910, 'PDF', 'PRESCRIPTION', 0),
(4, 101, '04_Discharge_Surgery_Feb2024.pdf', 'https://znwoerjmclnajtxhecek.supabase.co/storage/v1/object/public/patient-records/101/04_Discharge_Surgery_Feb2024.pdf', 4120, 'PDF', 'DISCHARGE_SUMMARY', 0),
(5, 101, '05_Consultation_Note_DrKapoor_Feb2024.pdf', 'https://znwoerjmclnajtxhecek.supabase.co/storage/v1/object/public/patient-records/101/05_Consultation_Note_DrKapoor_Feb2024.pdf', 4050, 'PDF', 'CONSULTATION', 0);

-- Patient 101 Events
INSERT INTO timeline_events (patient_id, document_id, entity, category, status, raw_value, raw_unit, normalized_value, raw_date, normalized_date, date_status, source_doc, page_number, source_passage, is_reviewed) VALUES
(101, 1, 'Metformin', 'MEDICATION', 'STARTED', '500', 'mg', '500 mg', '15/01/2022', '2022-01-15', 'CONFIDENT', '01_Prescription_2022.pdf', 1, 'Rx: Tab Metformin 500mg PO twice daily with meals.', 0),
(101, 2, 'Fasting Blood Glucose', 'LAB', 'COMPLETED', '7.8', 'mmol/L', '140.5 mg/dL', '04/05/2023', '2023-05-04', 'CONFIDENT', '02_Lab_Thyrocare_2023.pdf', 1, 'Fasting Blood Glucose: 7.8 mmol/L (Reference 3.9 - 5.6 mmol/L)', 0),
(101, 3, 'Metformin', 'MEDICATION', 'DOSE_CHANGED', '850', 'mg', '850 mg', '10/05/2023', '2023-05-10', 'CONFIDENT', '03_Prescription_2023.pdf', 1, 'Titrate Tab Metformin to 850mg PO twice daily due to elevated fasting sugar.', 0),
(101, 4, 'Aspirin', 'MEDICATION', 'TEMPORARILY_HELD', '75', 'mg', '75 mg', '12/02/2024', '2024-02-12', 'CONFIDENT', '04_Discharge_Surgery_Feb2024.pdf', 1, 'Discharge Instructions: Temporarily hold Aspirin 75mg daily for 7 days post-inguinal hernia repair.', 0),
(101, 5, 'Aspirin', 'MEDICATION', 'STARTED', '75', 'mg', '75 mg', '14/02/2024', '2024-02-14', 'CONFIDENT', '05_Consultation_Note_DrKapoor_Feb2024.pdf', 1, 'Cardiology follow-up: Continue Aspirin 75mg daily for cardiac prophylaxis.', 0);

-- Planted Direct Conflict for Patient 101
INSERT INTO contradictions (patient_id, tier, category, entity, description, doc1_name, quote1, doc2_name, quote2) VALUES
(101, 'DIRECT_CONFLICT', 'MEDICATION', 'Aspirin', 'Active order conflict: Surgery discharge instructions temporarily held Aspirin 75mg for 7 days, but cardiology consult note 48 hours later states to continue Aspirin 75mg.', '04_Discharge_Surgery_Feb2024.pdf', 'Temporarily hold Aspirin 75mg daily for 7 days post-inguinal hernia repair.', '05_Consultation_Note_DrKapoor_Feb2024.pdf', 'Cardiology follow-up: Continue Aspirin 75mg daily for cardiac prophylaxis.');

-- Patient 102 Allergy Contradiction
INSERT INTO contradictions (patient_id, tier, category, entity, description, doc1_name, quote1, doc2_name, quote2) VALUES
(102, 'NEEDS_REVIEW', 'ALLERGY', 'Ceftriaxone', 'Historical allergy discrepancy: 2022 clinical record documented No Known Drug Allergies (NKDA), but 2024 emergency summary records severe Ceftriaxone anaphylaxis.', '01_Annual_Health_Checkup_2022.pdf', 'Allergies: No Known Drug Allergies (NKDA).', '05_Emergency_Admission_2024.pdf', 'Severe allergic reaction / anaphylaxis to Ceftriaxone administered IV.');
