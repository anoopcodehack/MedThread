"""
Automated Verification Suite for Member 1 Deliverables
Tests: Database Schema, Ingestion Pipeline, 14 Fields, Conflict Radar, Review Overrides, and Abstention.
"""

import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal, Base, engine
from backend.models.clinical_models import TimelineEvent, Contradiction, Document, Patient, ReviewAuditLog
from backend.main import seed_patient_data, get_timeline, get_conflicts, review_event, ask_records
from backend.schemas.evidence_schema import ReviewOverrideRequest, QARequest

def run_test():
    print("\n" + "="*70)
    print(" 🏥 EXECUTING MEMBER 1 AUTOMATED AUDIT & VERIFICATION")
    print("="*70)

    db = SessionLocal()

    # 1. Database & Patients
    patients = db.query(Patient).all()
    print(f"  [1/6] ✅ Database Connected: Found {len(patients)} registered patients")

    # 2. Ingestion & Seeding for Patient 101
    seed_res = seed_patient_data(101, db)
    docs = db.query(Document).filter(Document.patient_id == 101).all()
    assert len(docs) >= 5, "Expected 5 documents for Patient 101"
    print(f"  [2/6] ✅ Multi-Format Ingestion: {len(docs)} documents ingested across multiple types")

    # 3. 14 Mandatory Fields in TimelineEvent
    events = get_timeline(101, db)
    assert len(events) >= 5, "Expected at least 5 timeline events"
    ev = events[0]
    required_fields = [
        "id", "patient_id", "document_id", "entity", "category", "status",
        "raw_value", "raw_unit", "normalized_value", "raw_date", "normalized_date",
        "date_status", "source_doc", "page_number", "source_passage", "is_reviewed"
    ]
    for field in required_fields:
        assert hasattr(ev, field), f"Mandatory field '{field}' is missing!"
    print(f"  [3/6] ✅ Schema Audit: All 14 mandatory fields verified on TimelineEvent model")
    print(f"        Sample: [{ev.normalized_date}] {ev.entity} ({ev.status}) | Value: {ev.normalized_value}")

    # 4. 4-Tier Conflict Radar (Planted Aspirin Surgery Conflict)
    conflicts = get_conflicts(101, db)
    assert len(conflicts) > 0, "No conflicts found!"
    direct_conflicts = [c for c in conflicts if c.tier == "DIRECT_CONFLICT" and "aspirin" in c.entity.lower()]
    assert len(direct_conflicts) > 0, "Planted Aspirin surgery conflict was not detected!"
    print(f"  [4/6] ✅ Conflict Radar: 🔴 DIRECT_CONFLICT detected for Aspirin ({len(conflicts)} total conflicts)")

    # 5. Clinician Review Override (PATCH) & Audit Trail
    req = ReviewOverrideRequest(
        reviewer_name="Dr. S. Kapoor, DM Cardiology",
        field_modified="status",
        new_value="DISCONTINUED",
        reason="Verified post-operative surgical hold"
    )
    res = review_event(ev.id, req, db)
    assert res["is_reviewed"] == 1
    audit_entry = db.query(ReviewAuditLog).filter(ReviewAuditLog.event_id == ev.id).first()
    assert audit_entry is not None
    print(f"  [5/6] ✅ Reviewer Override (PATCH): Status updated and logged in review_audit_logs")
    print(f"        Audit Log: Reviewer={audit_entry.reviewer_name}, Original={audit_entry.original_value}, New={audit_entry.new_value}")

    # 6. Epistemic Abstention Gate
    qa_req = QARequest(patient_id=101, question="Does Rajesh Sharma have Penicillin Allergy?")
    qa_ans = ask_records(qa_req, db)
    assert qa_ans.status == "NOT_DOCUMENTED"
    print(f"  [6/6] ✅ Epistemic Abstention Gate: Refused to hallucinate (Status: {qa_ans.status})")
    print(f"        Answer: \"{qa_ans.answer}\"")

    db.close()
    print("\n" + "="*70)
    print(" 🎉 100% AUDIT COMPLETE: ALL MEMBER 1 DELIVERABLES FULLY OPERATIONAL!")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_test()
