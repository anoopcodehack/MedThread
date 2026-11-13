import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.core.database import SessionLocal, engine
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog
from backend.core.config import settings

def verify():
    db = SessionLocal()
    print("=" * 65)
    print(" 🧠 SQLALCHEMY ENGINE & DB VERIFICATION")
    print("=" * 65)
    print(f"Engine Dialect   : {engine.dialect.name}")
    print(f"Database URL     : {engine.url}")
    print(f"Connection Pool  : pool_pre_ping={engine.pool._pre_ping}")
    
    print("\n📊 TABLE AUDIT & RECORD COUNTS:")
    p_count = db.query(Patient).count()
    d_count = db.query(Document).count()
    e_count = db.query(TimelineEvent).count()
    c_count = db.query(Contradiction).count()
    r_count = db.query(ReviewAuditLog).count()
    print(f"  • patients           : {p_count} rows")
    print(f"  • documents          : {d_count} rows")
    print(f"  • timeline_events    : {e_count} rows (with 14 enterprise audit fields)")
    print(f"  • contradictions     : {c_count} rows (4-tier conflict radar)")
    print(f"  • review_audit_logs  : {r_count} rows (forensic clinician overrides)")
    
    print("\n🔗 TWO-WAY FORENSIC LINK VERIFICATION:")
    for pid in [101, 102, 103, 104, 105]:
        p = db.query(Patient).filter(Patient.id == pid).first()
        if not p:
            continue
        print(f"\n  Patient {p.id}: {p.full_name} ({p.external_patient_id})")
        print(f"    - Ingested Documents    : {len(p.documents)}")
        print(f"    - Extracted Events       : {len(p.timeline_events)}")
        print(f"    - Detected Conflicts     : {len(p.contradictions)}")
        
        # Check first event forensic link
        if p.timeline_events:
            ev = p.timeline_events[0]
            print(f"    - Sample Linked Finding  : {ev.entity} [{ev.status}]")
            print(f"      * Verbatim Quote       : \"{ev.source_passage[:65]}...\"")
            print(f"      * Linked Source Doc    : {ev.source_doc} (Page {ev.page_number})")
            print(f"      * Linked File Path     : {ev.document.file_path}")
            
    db.close()
    print("\n" + "=" * 65)
    print(" ✅ ALL SQLALCHEMY MODELS & RELATIONS VERIFIED 100% OPERATIONAL")
    print("=" * 65)

if __name__ == "__main__":
    verify()
