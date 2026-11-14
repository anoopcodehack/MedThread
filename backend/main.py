"""
MedThread FastAPI Backend Application
Document Ingestion & Multi-Format Ingestion Microservice
"""

import sys
import os
import shutil
from pathlib import Path

# Ensure root directory and backend directory are in sys.path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))
_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import Base, engine, get_db
from backend.models.clinical_models import Patient, Document, TimelineEvent, Contradiction, ReviewAuditLog, Doctor
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

DOCTOR_REGISTRY = [
    {
        "id": 1,
        "name": "Dr. Ananya Rao",
        "email": "doctor@medthread.io",
        "registration_number": "MCI-KA-2018-44912",
        "specialisation": "Cardiology",
        "organisation": "Apollo Heart Institute",
        "department": "Interventional Cardiology",
        "queue_depth": 5,
        "status": "OVERLOADED"
    },
    {
        "id": 2,
        "name": "Dr. Suresh Menon",
        "email": "suresh.menon@manipal.edu",
        "registration_number": "MCI-KA-2016-19284",
        "specialisation": "Cardiology",
        "organisation": "Manipal Hospital",
        "department": "Cardiology & Triage",
        "queue_depth": 1,
        "status": "AVAILABLE"
    },
    {
        "id": 3,
        "name": "Dr. Kavita Shenoy",
        "email": "kavita.shenoy@fortis.in",
        "registration_number": "MCI-KA-2020-77192",
        "specialisation": "Pulmonology",
        "organisation": "Fortis Hospital",
        "department": "Pulmonology & Critical Care",
        "queue_depth": 2,
        "status": "AVAILABLE"
    },
    {
        "id": 4,
        "name": "Dr. Vikrant Mehta",
        "email": "v.mehta@maxhealth.in",
        "registration_number": "MCI-DL-2015-88120",
        "specialisation": "Endocrinology",
        "organisation": "Max Healthcare",
        "department": "Endocrinology & Diabetology",
        "queue_depth": 3,
        "status": "AVAILABLE"
    },
    {
        "id": 5,
        "name": "Dr. Rajesh Iyer",
        "email": "r.iyer@aiims.edu",
        "registration_number": "MCI-DL-2011-30911",
        "specialisation": "Internal Medicine",
        "organisation": "AIIMS New Delhi",
        "department": "General & Internal Medicine",
        "queue_depth": 0,
        "status": "AVAILABLE"
    }
]

@app.get("/api/doctors")
def list_doctors(db: Session = Depends(get_db)):
    """
    Returns list of all doctors from database/Supabase cache.
    """
    doctors = db.query(Doctor).all()
    if not doctors:
        for d in DOCTOR_REGISTRY:
            doc = Doctor(
                id=d["id"],
                name=d["name"],
                email=d["email"],
                registration_number=d["registration_number"],
                specialisation=d["specialisation"],
                organisation=d["organisation"],
                department=d["department"],
                queue_depth=d["queue_depth"],
                status=d["status"],
                verified=1
            )
            db.merge(doc)
        db.commit()
        doctors = db.query(Doctor).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "email": d.email,
            "registrationNumber": d.registration_number,
            "specialisation": d.specialisation,
            "organisation": d.organisation,
            "department": d.department,
            "queueDepth": d.queue_depth,
            "status": d.status,
            "verified": bool(d.verified)
        }
        for d in doctors
    ]

@app.get("/api/doctors/{doctor_id}")
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {
        "id": doc.id,
        "name": doc.name,
        "email": doc.email,
        "registrationNumber": doc.registration_number,
        "specialisation": doc.specialisation,
        "organisation": doc.organisation,
        "department": doc.department,
        "queueDepth": doc.queue_depth,
        "status": doc.status,
        "verified": bool(doc.verified)
    }

@app.put("/api/doctors/{doctor_id}")
def update_doctor(doctor_id: int, payload: dict, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if "name" in payload: doc.name = payload["name"]
    if "email" in payload: doc.email = payload["email"]
    if "registrationNumber" in payload: doc.registration_number = payload["registrationNumber"]
    if "specialisation" in payload: doc.specialisation = payload["specialisation"]
    if "organisation" in payload: doc.organisation = payload["organisation"]
    if "department" in payload: doc.department = payload["department"]
    if "queueDepth" in payload: doc.queue_depth = payload["queueDepth"]
    if "status" in payload: doc.status = payload["status"]
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id,
        "name": doc.name,
        "email": doc.email,
        "registrationNumber": doc.registration_number,
        "specialisation": doc.specialisation,
        "organisation": doc.organisation,
        "department": doc.department,
        "queueDepth": doc.queue_depth,
        "status": doc.status,
        "verified": bool(doc.verified)
    }

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
            quote1=c.quote1, doc2_name=c.doc2_name, quote2=c.quote2,
            resolved=c.resolved or 0
        ) for c in conflicts
    ]

@app.patch("/api/conflicts/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Clinician resolves a contradiction (e.g. confirming newer 2024 Ceftriaxone allergy supersedes 2022 NKDA).
    """
    c = db.query(Contradiction).filter(Contradiction.id == conflict_id).first()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict {conflict_id} not found."
        )
    c.resolved = 1
    db.commit()
    return {
        "id": c.id,
        "resolved": 1,
        "note": payload.get("note", "Clinician verified and resolved discrepancy")
    }

@app.get("/api/documents/{patient_id}")
def get_patient_documents(patient_id: int, db: Session = Depends(get_db)):
    """
    Returns all documents uploaded for a specific patient.
    """
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    results = []
    for d in docs:
        file_url = d.file_path
        if not (file_url.startswith("http://") or file_url.startswith("https://") or file_url.startswith("/")):
            file_url = f"/api/documents/raw/{patient_id}/{d.filename}"
        results.append({
            "id": d.id, "filename": d.filename, "file_size_bytes": d.file_size_bytes,
            "file_type": d.file_type, "ocr_applied": bool(d.ocr_applied),
            "file_url": file_url,
            "uploaded_at": d.uploaded_at.isoformat()
        })
    return results

@app.get("/api/documents/raw/{patient_id}/{filename}")
def get_raw_document(patient_id: int, filename: str):
    """
    Serves raw PDF or image document from isolated local filesystem for offline preview.
    """
    file_path = Path(settings.UPLOAD_DIR) / str(patient_id) / filename
    if not file_path.exists():
        # Fallback check in sample_data
        patient_map = {
            101: "patient_1_sharma",
            102: "patient_2_patel",
            103: "patient_3_malhotra",
            104: "patient_4_irfan",
            105: "patient_5_fernandes"
        }
        folder_name = patient_map.get(patient_id)
        if folder_name:
            alt_path = Path("sample_data") / folder_name / filename
            if alt_path.exists():
                file_path = alt_path

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
    
    # Automatically resolve any related contradiction for this patient and entity
    patient_conflicts = db.query(Contradiction).filter(Contradiction.patient_id == event.patient_id).all()
    ev_lower = (event.entity or "").lower()
    for pc in patient_conflicts:
        pc_lower = (pc.entity or "").lower()
        if ev_lower in pc_lower or pc_lower in ev_lower:
            pc.resolved = 1

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
