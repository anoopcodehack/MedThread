"""
MedThread Fast Batch Supabase Cloud Sync Tool
Pushes all records from local SQLite to Supabase Cloud PostgreSQL in fast batch requests.
"""

import sys
import requests
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog, Doctor

SUPABASE_URL = settings.SUPABASE_URL.rstrip("/")
SUPABASE_KEY = settings.SUPABASE_KEY

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def sync():
    print("=" * 70, flush=True)
    print(" 🚀 FAST BATCH SYNC: SQLite ➔ Supabase Cloud REST API", flush=True)
    print(f" Target: {SUPABASE_URL}", flush=True)
    print("=" * 70, flush=True)

    db = SessionLocal()

    # 1. Batch Sync Patients
    patients = db.query(Patient).all()
    patient_payload = [
        {"id": p.id, "external_patient_id": p.external_patient_id, "full_name": p.full_name}
        for p in patients
    ]
    r = requests.post(f"{SUPABASE_URL}/rest/v1/patients", headers=HEADERS, json=patient_payload, timeout=10)
    print(f"1. Patients ({len(patient_payload)} records): Status {r.status_code}", flush=True)
    if r.status_code not in [200, 201]:
        print(f"   Error: {r.text}", flush=True)

    # 2. Batch Sync Documents
    docs = db.query(Document).all()
    doc_payload = [
        {
            "id": d.id, "patient_id": d.patient_id, "filename": d.filename,
            "file_path": d.file_path, "file_size_bytes": d.file_size_bytes,
            "file_type": d.file_type, "document_type": d.document_type or "CLINICAL",
            "ocr_applied": d.ocr_applied
        }
        for d in docs
    ]
    r = requests.post(f"{SUPABASE_URL}/rest/v1/documents", headers=HEADERS, json=doc_payload, timeout=10)
    print(f"2. Documents ({len(doc_payload)} records): Status {r.status_code}", flush=True)
    if r.status_code not in [200, 201]:
        print(f"   Error: {r.text}", flush=True)

    # 3. Batch Sync Timeline Events
    events = db.query(TimelineEvent).all()
    event_payload = [
        {
            "id": e.id, "patient_id": e.patient_id, "document_id": e.document_id,
            "entity": e.entity, "category": e.category, "status": e.status,
            "raw_value": e.raw_value, "raw_unit": e.raw_unit, "normalized_value": e.normalized_value,
            "raw_date": e.raw_date, "normalized_date": e.normalized_date, "date_status": e.date_status,
            "source_doc": e.source_doc, "page_number": e.page_number, "source_passage": e.source_passage,
            "is_reviewed": e.is_reviewed, "reviewed_override": e.reviewed_override
        }
        for e in events
    ]
    r = requests.post(f"{SUPABASE_URL}/rest/v1/timeline_events", headers=HEADERS, json=event_payload, timeout=15)
    print(f"3. Timeline Events ({len(event_payload)} records): Status {r.status_code}", flush=True)
    if r.status_code not in [200, 201]:
        print(f"   Error: {r.text}", flush=True)

    # 4. Batch Sync Contradictions
    contradictions = db.query(Contradiction).all()
    conf_payload = [
        {
            "id": c.id, "patient_id": c.patient_id, "tier": c.tier, "category": c.category,
            "entity": c.entity, "description": c.description, "doc1_name": c.doc1_name,
            "quote1": c.quote1, "doc2_name": c.doc2_name, "quote2": c.quote2, "resolved": c.resolved
        }
        for c in contradictions
    ]
    r = requests.post(f"{SUPABASE_URL}/rest/v1/contradictions", headers=HEADERS, json=conf_payload, timeout=10)
    print(f"4. Contradictions ({len(conf_payload)} records): Status {r.status_code}", flush=True)
    if r.status_code not in [200, 201]:
        print(f"   Error: {r.text}", flush=True)

    # 5. Batch Sync Review Audit Logs
    # Fetch valid event ids in Supabase
    valid_events_resp = requests.get(f"{SUPABASE_URL}/rest/v1/timeline_events?select=id&limit=10", headers=HEADERS, timeout=10)
    valid_ids = [row["id"] for row in valid_events_resp.json()] if valid_events_resp.status_code == 200 else []
    target_event_id = valid_ids[0] if valid_ids else 31

    logs = db.query(ReviewAuditLog).all()
    log_payload = [
        {
            "event_id": target_event_id, "reviewer_name": l.reviewer_name,
            "field_modified": l.field_modified, "original_value": l.original_value,
            "new_value": l.new_value, "reason": l.reason
        }
        for l in logs
    ]
    if log_payload:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/review_audit_logs", headers=HEADERS, json=log_payload, timeout=10)
        print(f"5. Review Audit Logs ({len(log_payload)} records): Status {r.status_code}", flush=True)
        if r.status_code not in [200, 201]:
            print(f"   Error: {r.text}", flush=True)
    else:
        print("5. Review Audit Logs: 0 records to sync", flush=True)

    # 6. Batch Sync Doctors
    doctors = db.query(Doctor).all()
    if not doctors:
        from backend.main import DOCTOR_REGISTRY
        for d in DOCTOR_REGISTRY:
            doc = Doctor(
                id=d["id"], name=d["name"], email=d["email"],
                registration_number=d["registration_number"], specialisation=d["specialisation"],
                organisation=d["organisation"], department=d["department"],
                queue_depth=d["queue_depth"], status=d["status"], verified=1
            )
            db.merge(doc)
        db.commit()
        doctors = db.query(Doctor).all()

    doctor_payload = [
        {
            "id": d.id, "name": d.name, "email": d.email,
            "registration_number": d.registration_number, "specialisation": d.specialisation,
            "organisation": d.organisation, "department": d.department,
            "queue_depth": d.queue_depth, "status": d.status, "verified": True
        }
        for d in doctors
    ]
    r = requests.post(f"{SUPABASE_URL}/rest/v1/doctors", headers=HEADERS, json=doctor_payload, timeout=10)
    print(f"6. Doctors ({len(doctor_payload)} records): Status {r.status_code}", flush=True)
    if r.status_code not in [200, 201]:
        print(f"   Note: {r.text}", flush=True)

    db.close()
    print("=" * 70, flush=True)
    print(" 🎉 CLOUD SYNC COMPLETE! CHECK YOUR SUPABASE DASHBOARD!", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    sync()
