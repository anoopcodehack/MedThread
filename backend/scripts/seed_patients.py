"""
MedThread Full Patient Dataset Seeder
Ingests all 25 synthetic benchmark documents across 5 clinical archetypes
directly into the database (SQLite or Supabase PostgreSQL).
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction
from backend.schemas.evidence_schema import TimelineEventItem
from backend.services.extractor_service import extract_text_from_pdf, parse_clinical_entities
from backend.services.rules_engine import normalize_clinical_unit, normalize_date
from backend.services.reconciliation_service import detect_contradictions
from backend.services.storage_service import storage_service

PATIENT_MAPPING = {
    101: {"name": "Rajesh Sharma", "folder": "patient_1_sharma"},
    102: {"name": "Priya Patel", "folder": "patient_2_patel"},
    103: {"name": "Vikram Malhotra", "folder": "patient_3_malhotra"},
    104: {"name": "Mohammed Irfan", "folder": "patient_4_irfan"},
    105: {"name": "David Fernandes", "folder": "patient_5_fernandes"}
}

def seed_all_patients():
    db = SessionLocal()
    sample_dir = PROJECT_ROOT / "sample_data"
    
    print("=" * 70)
    print(" 🏥 SEEDING ALL 5 CLINICAL BENCHMARK PATIENTS INTO DATABASE")
    print("=" * 70)
    
    total_docs = 0
    total_events = 0
    total_conflicts = 0

    try:
        for pid, meta in PATIENT_MAPPING.items():
            patient = db.query(Patient).filter(Patient.id == pid).first()
            if not patient:
                patient = Patient(id=pid, external_patient_id=f"PAT-{pid}", full_name=meta["name"])
                db.add(patient)
                db.commit()
                db.refresh(patient)

            patient_folder = sample_dir / meta["folder"]
            if not patient_folder.exists():
                print(f"⚠️ Warning: Directory not found {patient_folder}")
                continue

            doc_files = sorted([
                f for f in os.listdir(patient_folder) 
                if f.endswith(".pdf") or f.endswith(".txt")
            ])
            
            p_docs = 0
            for doc_name in doc_files:
                doc_path = patient_folder / doc_name
                with open(doc_path, "rb") as f:
                    content = f.read()

                # Save hybrid (local disk + Supabase Storage)
                storage_res = storage_service.save_document(str(pid), doc_name, content)
                local_path = storage_res["local_path"]
                storage_url = storage_res["storage_url"]

                doc_record = db.query(Document).filter(
                    Document.patient_id == pid,
                    Document.filename == doc_name
                ).first()

                if not doc_record:
                    doc_record = Document(
                        patient_id=pid,
                        filename=doc_name,
                        file_path=storage_url,
                        file_size_bytes=len(content),
                        file_type="PDF" if doc_name.endswith(".pdf") else "TXT",
                        ocr_applied=0
                    )
                    db.add(doc_record)
                    db.commit()
                    db.refresh(doc_record)

                # Extract entities
                full_text, ocr_applied, pages = extract_text_from_pdf(local_path)
                raw_events = parse_clinical_entities(full_text, doc_name, pages)

                # Delete existing events for doc before re-adding
                db.query(TimelineEvent).filter(TimelineEvent.document_id == doc_record.id).delete()

                for item in raw_events:
                    norm_date, date_status = normalize_date(item["raw_date"])
                    norm_val, norm_unit = normalize_clinical_unit(item["entity"], item.get("raw_value"), item.get("raw_unit"))
                    norm_display = f"{norm_val} {norm_unit}".strip() if norm_val else None

                    ev = TimelineEvent(
                        patient_id=pid,
                        document_id=doc_record.id,
                        entity=item["entity"],
                        category=item["category"],
                        status=item["status"],
                        raw_value=item.get("raw_value"),
                        raw_unit=item.get("raw_unit"),
                        normalized_value=norm_display,
                        raw_date=item["raw_date"],
                        normalized_date=norm_date,
                        date_status=date_status,
                        source_doc=item["source_doc"],
                        page_number=item.get("page_number", 1),
                        source_passage=item["source_passage"],
                        is_reviewed=0
                    )
                    db.add(ev)
                db.commit()
                p_docs += 1

            # Run 4-Tier Contradiction Detection for patient
            all_events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == pid).all()
            event_items = [
                TimelineEventItem(
                    id=e.id, patient_id=e.patient_id, document_id=e.document_id,
                    entity=e.entity, category=e.category, status=e.status,
                    raw_value=e.raw_value, raw_unit=e.raw_unit, normalized_value=e.normalized_value,
                    raw_date=e.raw_date, normalized_date=e.normalized_date, date_status=e.date_status,
                    source_doc=e.source_doc, page_number=e.page_number, source_passage=e.source_passage,
                    is_reviewed=e.is_reviewed
                ) for e in all_events
            ]
            conflicts = detect_contradictions(event_items)

            db.query(Contradiction).filter(Contradiction.patient_id == pid).delete()
            for c in conflicts:
                rec = Contradiction(
                    patient_id=pid, tier=c.tier, category=c.category,
                    entity=c.entity, description=c.description,
                    doc1_name=c.doc1_name, quote1=c.quote1,
                    doc2_name=c.doc2_name, quote2=c.quote2
                )
                db.add(rec)
            db.commit()

            print(f"  • Patient {pid} ({meta['name'].ljust(18)}): {p_docs} docs | {len(all_events)} events | {len(conflicts)} conflicts")
            total_docs += p_docs
            total_events += len(all_events)
            total_conflicts += len(conflicts)

        print("-" * 70)
        print(f"✅ Seeding Complete: {total_docs} Documents | {total_events} Events | {total_conflicts} Conflicts")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_patients()
