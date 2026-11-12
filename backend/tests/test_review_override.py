import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import review_event
from backend.core.database import SessionLocal
from backend.models.clinical_models import TimelineEvent, ReviewAuditLog
from backend.schemas.evidence_schema import ReviewOverrideRequest

def test_reviewer_override_keeps_original_evidence():
    db = SessionLocal()
    
    # 1. Fetch an event
    ev = db.query(TimelineEvent).filter(TimelineEvent.entity == "Metformin").first()
    if not ev:
        ev = db.query(TimelineEvent).first()
        
    original_quote = ev.source_passage
    original_status = ev.status
    print("=" * 70)
    print(" 🏥 TESTING PROBLEM 10: CLINICIAN OVERRIDE & EVIDENCE IMMUTABILITY")
    print("=" * 70)
    print(f"Target Event ID:      {ev.id} ({ev.entity})")
    print(f"Original Status:      {original_status}")
    print(f"Original Raw Quote:   \"{original_quote}\"")
    
    # 2. Clinician performs review override
    req = ReviewOverrideRequest(
        reviewer_name="Dr. Ananya Rao",
        field_modified="status",
        new_value="DISCONTINUED",
        reason="Verified with patient: discontinued due to GI intolerance."
    )
    
    res = review_event(event_id=ev.id, req=req, db=db)
    print(f"\n✅ review_event Executed: is_reviewed={res['is_reviewed']}")
    print(f"Reviewed Override: {res['reviewed_override']}")
    
    # 3. Verify in review_audit_logs table
    audit_entry = db.query(ReviewAuditLog).filter(ReviewAuditLog.event_id == ev.id).order_by(ReviewAuditLog.id.desc()).first()
    assert audit_entry is not None
    assert audit_entry.reviewer_name == "Dr. Ananya Rao"
    assert audit_entry.new_value == "DISCONTINUED"
    print(f"\n✅ review_audit_logs Entry Verified:")
    print(f"   • Reviewer:       {audit_entry.reviewer_name}")
    print(f"   • Field Modified: {audit_entry.field_modified}")
    print(f"   • Original Value: {audit_entry.original_value}")
    print(f"   • New Value:      {audit_entry.new_value}")
    print(f"   • Reason:         {audit_entry.reason}")
    print(f"   • Timestamp:      {audit_entry.reviewed_at}")
    
    # 4. CRITICAL RUBRIC TEST: Original evidence kept 100% immutable!
    db.refresh(ev)
    assert ev.status == "DISCONTINUED"
    assert ev.is_reviewed == 1
    assert ev.source_passage == original_quote, "ERROR: Original source passage was altered!"
    print(f"\n✅ Immutability Verified:")
    print(f"   • Updated Status:         {ev.status}")
    print(f"   • Clinician Audit Banner: {ev.reviewed_override}")
    print(f"   • Raw Evidence Kept:      \"{ev.source_passage}\" (100% UNTOUCHED)")
    print("=" * 70)
    print(" 🎉 PROBLEM 10 VALIDATED: CLINICIAN OVERRIDE AUDIT COMPLETE!")
    print("=" * 70)
    
    db.close()

if __name__ == "__main__":
    test_reviewer_override_keeps_original_evidence()
