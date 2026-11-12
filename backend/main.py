"""
MedThread FastAPI Backend Application
Document Ingestion & Multi-Format Ingestion Microservice
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import Base, engine, get_db
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog
from backend.schemas.evidence_schema import (
    TimelineEventItem,
    ContradictionItem,
    QARequest,
    QAResponse,
    ReviewOverrideRequest,
    ExtractionReport
)
from backend.services.extractor_service import extract_text_from_pdf, parse_clinical_entities
from backend.services.rules_engine import normalize_clinical_unit, normalize_date
from backend.services.reconciliation_service import detect_contradictions
from backend.services.qa_service import answer_clinical_question
from backend.services.storage_service import storage_service

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Evidence-First Medical History Engine API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for static file serving & browser PDF viewing
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

PATIENT_REGISTRY = {
    101: "Rajesh Sharma",
    102: "Priya Patel",
    103: "Vikram Malhotra",
    104: "Mohammed Irfan",
    105: "David Fernandes"
}

def get_or_create_patient(db: Session, patient_id: int) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        name = PATIENT_REGISTRY.get(patient_id, f"Patient {patient_id}")
        patient = Patient(id=patient_id, external_patient_id=f"PAT-{patient_id}", full_name=name)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

@app.get("/")
def root():
    return {"project": "MedThread", "version": settings.VERSION, "status": "online"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db)):
    """
    Returns list of all registered patients in the database.
    """
    patients = db.query(Patient).all()
    if not patients:
        for pid, name in PATIENT_REGISTRY.items():
            get_or_create_patient(db, pid)
        patients = db.query(Patient).all()
    return [{"id": p.id, "external_id": p.external_patient_id, "name": p.full_name} for p in patients]

@app.post("/api/upload", response_model=ExtractionReport)
async def upload_document(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Secure file upload with 15MB cap, extension validation, PyMuPDF text parsing,
    and fallback to Gemini Vision OCR.
    """
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{file_ext}'. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
        
    content = await file.read()
    total_size = len(content)
    if total_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed size limit of 15MB."
        )
        
    # Hybrid save: writes locally for extraction and uploads to Supabase Storage
    storage_res = storage_service.save_document(str(patient_id), file.filename, content)
    local_path = storage_res["local_path"]
    storage_url = storage_res["storage_url"]
            
    patient = get_or_create_patient(db, patient_id)
    full_text, ocr_applied, pages = extract_text_from_pdf(local_path)
    
    doc_record = Document(
        patient_id=patient.id,
        filename=file.filename,
        file_path=storage_url,
        file_size_bytes=total_size,
        file_type="PDF" if file_ext == ".pdf" else "IMAGE",
        ocr_applied=1 if ocr_applied else 0
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)
    
    raw_events = parse_clinical_entities(full_text, file.filename, pages)
    extracted_items = []
    
    for item in raw_events:
        norm_date, date_status = normalize_date(item["raw_date"])
        norm_val, norm_unit = normalize_clinical_unit(item["entity"], item.get("raw_value"), item.get("raw_unit"))
        norm_display = f"{norm_val} {norm_unit}".strip() if norm_val else None
        
        ev = TimelineEvent(
            patient_id=patient.id,
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
        db.refresh(ev)
        
        extracted_items.append(TimelineEventItem(
            id=ev.id, patient_id=ev.patient_id, document_id=ev.document_id,
            entity=ev.entity, category=ev.category, status=ev.status,
            raw_value=ev.raw_value, raw_unit=ev.raw_unit, normalized_value=ev.normalized_value,
            raw_date=ev.raw_date, normalized_date=ev.normalized_date, date_status=ev.date_status,
            source_doc=ev.source_doc, page_number=ev.page_number, source_passage=ev.source_passage,
            is_reviewed=ev.is_reviewed
        ))

    # Evaluate contradictions across all patient events
    all_events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient_id).all()
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
    detected_conflicts = detect_contradictions(event_items)
    db.query(Contradiction).filter(Contradiction.patient_id == patient_id).delete()
    for conf in detected_conflicts:
        c_record = Contradiction(
            patient_id=patient_id, tier=conf.tier, category=conf.category,
            entity=conf.entity, description=conf.description, doc1_name=conf.doc1_name,
            quote1=conf.quote1, doc2_name=conf.doc2_name, quote2=conf.quote2
        )
        db.add(c_record)
    db.commit()
        
    return ExtractionReport(
        patient_id=patient_id, document_id=doc_record.id, filename=file.filename,
        ocr_applied=ocr_applied, events_extracted=len(extracted_items), events=extracted_items
    )

@app.get("/api/timeline/{patient_id}", response_model=List[TimelineEventItem])
def get_timeline(patient_id: int, db: Session = Depends(get_db)):
    """
    Returns chronologically sorted timeline events for a given patient.
    """
    events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.patient_id == patient_id)
        .order_by(TimelineEvent.normalized_date.asc())
        .all()
    )
    return [
        TimelineEventItem(
            id=e.id, patient_id=e.patient_id, document_id=e.document_id,
            entity=e.entity, category=e.category, status=e.status,
            raw_value=e.raw_value, raw_unit=e.raw_unit, normalized_value=e.normalized_value,
            raw_date=e.raw_date, normalized_date=e.normalized_date, date_status=e.date_status,
            source_doc=e.source_doc, page_number=e.page_number, source_passage=e.source_passage,
            is_reviewed=e.is_reviewed, reviewed_override=e.reviewed_override
        ) for e in events
    ]

@app.get("/api/conflicts/{patient_id}", response_model=List[ContradictionItem])
def get_conflicts(patient_id: int, db: Session = Depends(get_db)):
    """
    Returns detected contradiction radar items (Direct conflict, Needs review, Duplicates).
    """
    conflicts = db.query(Contradiction).filter(Contradiction.patient_id == patient_id).all()
    return [
        ContradictionItem(
            id=c.id, patient_id=c.patient_id, tier=c.tier, category=c.category,
            entity=c.entity, description=c.description, doc1_name=c.doc1_name,
            quote1=c.quote1, doc2_name=c.doc2_name, quote2=c.quote2
        ) for c in conflicts
    ]

@app.get("/api/documents/{patient_id}")
def get_patient_documents(patient_id: int, db: Session = Depends(get_db)):
    """
    Returns all documents uploaded for a specific patient.
    """
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    return [
        {
            "id": d.id, "filename": d.filename, "file_size_bytes": d.file_size_bytes,
            "file_type": d.file_type, "ocr_applied": bool(d.ocr_applied),
            "file_url": d.file_path,
            "uploaded_at": d.uploaded_at.isoformat()
        } for d in docs
    ]

@app.get("/api/documents/raw/{patient_id}/{filename}")
def get_raw_document(patient_id: int, filename: str):
    """
    Serves raw PDF or image document from isolated local filesystem for offline preview.
    """
    file_path = Path(settings.UPLOAD_DIR) / str(patient_id) / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {filename} not found for patient {patient_id}."
        )
    return FileResponse(path=str(file_path), filename=filename)

@app.patch("/api/review/{event_id}")
def review_event(
    event_id: int,
    req: ReviewOverrideRequest,
    db: Session = Depends(get_db)
):
    """
    Allows clinician override while preserving immutable machine-extracted evidence.
    Logs modification into review_audit_logs.
    """
    event = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TimelineEvent {event_id} not found."
        )
        
    original_val = getattr(event, req.field_modified, str(event.status))
    
    audit_log = ReviewAuditLog(
        event_id=event.id,
        reviewer_name=req.reviewer_name,
        field_modified=req.field_modified,
        original_value=str(original_val),
        new_value=req.new_value,
        reason=req.reason
    )
    db.add(audit_log)
    
    if hasattr(event, req.field_modified):
        setattr(event, req.field_modified, req.new_value)
    event.is_reviewed = 1
    event.reviewed_override = f"Modified by {req.reviewer_name}: {req.field_modified} set to '{req.new_value}'. Reason: {req.reason or 'Clinician verified'}"
    
    db.commit()
    db.refresh(event)
    
    return {
        "event_id": event.id,
        "is_reviewed": event.is_reviewed,
        "reviewed_override": event.reviewed_override
    }

@app.post("/api/qa", response_model=QAResponse)
def ask_records(req: QARequest, db: Session = Depends(get_db)):
    """
    Two-stage epistemic abstention Q&A answering strictly from patient records.
    """
    events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == req.patient_id).all()
    timeline_items = [
        TimelineEventItem(
            id=e.id, patient_id=e.patient_id, document_id=e.document_id,
            entity=e.entity, category=e.category, status=e.status,
            raw_value=e.raw_value, raw_unit=e.raw_unit, normalized_value=e.normalized_value,
            raw_date=e.raw_date, normalized_date=e.normalized_date, date_status=e.date_status,
            source_doc=e.source_doc, page_number=e.page_number, source_passage=e.source_passage,
            is_reviewed=e.is_reviewed
        ) for e in events
    ]
    return answer_clinical_question(req, timeline_items)

@app.post("/api/seed/{patient_id}")
def seed_patient_data(patient_id: int, db: Session = Depends(get_db)):
    """
    Helper endpoint for hackathon demo:
    Automatically ingests the 5 pre-generated synthetic documents from sample_data/
    into the database for the given patient ID.
    """
    patient_folder_map = {
        101: "patient_1_sharma",
        102: "patient_2_patel",
        103: "patient_3_malhotra",
        104: "patient_4_irfan",
        105: "patient_5_fernandes"
    }
    folder_name = patient_folder_map.get(patient_id)
    if not folder_name:
        raise HTTPException(status_code=400, detail="Invalid patient ID for seeding")
        
    sample_dir = Path("sample_data") / folder_name
    if not sample_dir.exists():
        raise HTTPException(status_code=404, detail=f"Sample directory {sample_dir} not found")
        
    patient = get_or_create_patient(db, patient_id)
    pdf_files = sorted(list(sample_dir.glob("*.pdf")))
    ingested_count = 0
    
    for pdf_path in pdf_files:
        existing = db.query(Document).filter(
            Document.patient_id == patient_id,
            Document.filename == pdf_path.name
        ).first()
        if existing:
            continue
            
        full_text, ocr_applied, pages = extract_text_from_pdf(str(pdf_path))
        doc_record = Document(
            patient_id=patient.id,
            filename=pdf_path.name,
            file_path=str(pdf_path),
            file_size_bytes=pdf_path.stat().st_size,
            file_type="PDF",
            ocr_applied=1 if ocr_applied else 0
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)
        
        raw_events = parse_clinical_entities(full_text, pdf_path.name, pages)
        for item in raw_events:
            norm_date, date_status = normalize_date(item["raw_date"])
            norm_val, norm_unit = normalize_clinical_unit(item["entity"], item.get("raw_value"), item.get("raw_unit"))
            norm_display = f"{norm_val} {norm_unit}".strip() if norm_val else None
            
            ev = TimelineEvent(
                patient_id=patient.id,
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
        ingested_count += 1
        
    all_events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient_id).all()
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
    detected_conflicts = detect_contradictions(event_items)
    db.query(Contradiction).filter(Contradiction.patient_id == patient_id).delete()
    for conf in detected_conflicts:
        c_record = Contradiction(
            patient_id=patient_id, tier=conf.tier, category=conf.category,
            entity=conf.entity, description=conf.description, doc1_name=conf.doc1_name,
            quote1=conf.quote1, doc2_name=conf.doc2_name, quote2=conf.quote2
        )
        db.add(c_record)
    db.commit()
    
    return {
        "status": "success",
        "patient_id": patient_id,
        "documents_ingested": ingested_count,
        "total_events": len(all_events),
        "conflicts_detected": len(detected_conflicts)
    }

@app.post("/api/documents/signed-url")
def generate_document_signed_url(
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Generates a 60-minute time-bound signed URL for clinical access control.
    """
    patient_id = payload.get("patient_id")
    filename = payload.get("filename")
    expires_in = int(payload.get("expires_in", 3600))
    
    if not (patient_id and filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both 'patient_id' and 'filename' are required."
        )
        
    signed_url = storage_service.create_signed_url(str(patient_id), filename, expires_in)
    if not signed_url:
        signed_url = f"/api/documents/raw/{patient_id}/{filename}"
        
    return {
        "patient_id": patient_id,
        "filename": filename,
        "signed_url": signed_url,
        "expires_in_seconds": expires_in
    }

@app.get("/api/system/status")
def system_diagnostics(db: Session = Depends(get_db)):
    """
    Returns live system architecture telemetry:
    - Active Database Engine (SQLite or Supabase PostgreSQL)
    - Storage Mode (Supabase Object Storage or Local Sandbox)
    - Live Entity Counts
    """
    db_dialect = engine.dialect.name
    is_postgres = "postgres" in db_dialect
    
    db_type = "PostgreSQL (Supabase Cloud)" if is_postgres else "SQLite (Local Bulletproof)"
    
    # Mask database URL
    raw_url = str(engine.url)
    if "@" in raw_url:
        masked_url = raw_url.split("@")[0].split("://")[0] + "://***:***@" + raw_url.split("@")[1]
    else:
        masked_url = raw_url
        
    storage_type = "Supabase Storage Bucket ('patient-records')" if (settings.SUPABASE_URL and settings.SUPABASE_KEY) else "Local Filesystem ('./uploads')"
    
    patient_count = db.query(Patient).count()
    doc_count = db.query(Document).count()
    event_count = db.query(TimelineEvent).count()
    conflict_count = db.query(Contradiction).count()
    
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "type": db_type,
            "dialect": db_dialect,
            "connection": masked_url,
            "pool_pre_ping": True
        },
        "storage": {
            "backend": storage_type,
            "bucket": settings.SUPABASE_BUCKET,
            "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        },
        "telemetry": {
            "registered_patients": patient_count,
            "ingested_documents": doc_count,
            "timeline_events": event_count,
            "detected_conflicts": conflict_count
        }
    }
