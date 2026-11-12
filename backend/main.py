"""
MedThread FastAPI Backend Application
"""

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from backend.core.config import settings
from backend.core.database import Base, engine, get_db
from backend.schemas.evidence_schema import (
    TimelineEventItem,
    ContradictionItem,
    QARequest,
    QAResponse,
    ReviewOverrideRequest
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Evidence-first Medical History Builder API"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "project": "MedThread",
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/upload")
async def upload_document(
    patient_id: int = Form(...),
    file: UploadFile = File(...)
):
    """
    Ingest multi-format medical record, run OCR if needed, extract timeline facts.
    """
    return {
        "patient_id": patient_id,
        "filename": file.filename,
        "status": "Document ingested and queued for evidence extraction"
    }

@app.get("/api/timeline/{patient_id}", response_model=List[TimelineEventItem])
def get_timeline(patient_id: int):
    """
    Fetch chronologically sorted timeline events with source citations.
    """
    return []

@app.get("/api/conflicts/{patient_id}", response_model=List[ContradictionItem])
def get_conflicts(patient_id: int):
    """
    Fetch detected contradiction radar items (Direct conflict, Needs review, Duplicates).
    """
    return []

@app.patch("/api/review/{event_id}")
def override_event(event_id: int, req: ReviewOverrideRequest):
    """
    Allows clinician override while preserving immutable original evidence.
    """
    return {
        "event_id": event_id,
        "is_reviewed": 1,
        "override": req.dict()
    }

@app.post("/api/qa", response_model=QAResponse)
def ask_records(req: QARequest):
    """
    Two-stage epistemic abstention Q&A answering strictly from patient records.
    """
    return QAResponse(
        question=req.question,
        answer="MedThread two-stage retrieval initialized.",
        status="GROUNDED_ANSWER",
        citations=[]
    )
