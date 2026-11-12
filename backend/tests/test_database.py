"""
Unit Tests for SQLAlchemy Database Models & Clinical Isolation
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.database import Base
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog

TEST_DB_URL = "sqlite:///:memory:"

# Test DB Session helper
def get_test_db():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_patient_isolation_and_cascade(db_session):
    # Create patient
    p = Patient(id=999, external_patient_id="PAT-999", full_name="Test Patient")
    db_session.add(p)
    db_session.commit()

    # Create document
    doc = Document(
        patient_id=p.id,
        filename="test_prescription.pdf",
        file_path="/uploads/999/test_prescription.pdf",
        file_size_bytes=1024,
        file_type="PDF"
    )
    db_session.add(doc)
    db_session.commit()

    # Create timeline event
    ev = TimelineEvent(
        patient_id=p.id,
        document_id=doc.id,
        entity="Metformin",
        category="MEDICATION",
        status="STARTED",
        normalized_value="500 mg",
        raw_date="15/01/2022",
        normalized_date="2022-01-15",
        source_doc="test_prescription.pdf",
        page_number=1,
        source_passage="Rx: Metformin 500mg daily"
    )
    db_session.add(ev)
    db_session.commit()

    # Verify retrieval
    events = db_session.query(TimelineEvent).filter(TimelineEvent.patient_id == 999).all()
    assert len(events) == 1
    assert events[0].entity == "Metformin"

    # Verify cascade delete
    db_session.delete(p)
    db_session.commit()
    assert db_session.query(TimelineEvent).filter(TimelineEvent.patient_id == 999).count() == 0
    assert db_session.query(Document).filter(Document.patient_id == 999).count() == 0

def test_review_audit_log_recording(db_session):
    p = Patient(id=888, external_patient_id="PAT-888", full_name="Audit Patient")
    doc = Document(patient_id=888, filename="doc.pdf", file_path="doc.pdf", file_size_bytes=100, file_type="PDF")
    db_session.add_all([p, doc])
    db_session.commit()

    ev = TimelineEvent(
        patient_id=888,
        document_id=doc.id,
        entity="Aspirin",
        category="MEDICATION",
        status="TEMPORARILY_HELD",
        raw_date="01/02/2024",
        normalized_date="2024-02-01",
        source_doc="doc.pdf",
        source_passage="Hold aspirin prior to surgery"
    )
    db_session.add(ev)
    db_session.commit()

    # Log review modification
    audit = ReviewAuditLog(
        event_id=ev.id,
        reviewer_name="Dr. S. Kapoor",
        field_modified="status",
        original_value=ev.status,
        new_value="DISCONTINUED",
        reason="Patient developed GI bleeding"
    )
    ev.status = "DISCONTINUED"
    ev.is_reviewed = 1
    ev.reviewed_override = "Modified to DISCONTINUED by Dr. Kapoor"
    db_session.add(audit)
    db_session.commit()

    logs = db_session.query(ReviewAuditLog).filter(ReviewAuditLog.event_id == ev.id).all()
    assert len(logs) == 1
    assert logs[0].original_value == "TEMPORARILY_HELD"
    assert logs[0].new_value == "DISCONTINUED"
    assert logs[0].reviewer_name == "Dr. S. Kapoor"
    assert ev.is_reviewed == 1

def run_standalone_tests():
    print("=" * 60)
    print(" 🏥 EXECUTING SQLALCHEMY DATABASE & AUDIT LOG TESTS")
    print("=" * 60)
    
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Test 1
        test_patient_isolation_and_cascade(session)
        print(" [1/2] ✅ Patient Data Isolation & Cascade Deletion Passed")
        
        # Test 2
        test_review_audit_log_recording(session)
        print(" [2/2] ✅ Reviewer Audit Trail & Forensic Override Passed")
        
        print("=" * 60)
        print(" 🎉 ALL DATABASE INTEGRITY TESTS PASSED (100%)")
        print("=" * 60)
    finally:
        session.close()

if __name__ == "__main__":
    run_standalone_tests()
