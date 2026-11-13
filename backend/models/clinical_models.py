from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    external_patient_id = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="patient", cascade="all, delete-orphan")
    contradictions = relationship("Contradiction", back_populates="patient", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    filename = Column(String(256), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(64), nullable=False)      # "PDF", "IMAGE"
    document_type = Column(String(64), nullable=True)  # "PRESCRIPTION", "LAB_REPORT", "DISCHARGE_SUMMARY", "CONSULTATION"
    ocr_applied = Column(Integer, default=0)           # 1 if Gemini Vision fallback was triggered
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="documents")
    events = relationship("TimelineEvent", back_populates="document", cascade="all, delete-orphan")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    # All 14 required enterprise audit fields
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    entity = Column(String(128), nullable=False)               # "Metformin", "Fasting Glucose"
    category = Column(String(64), nullable=False)             # "MEDICATION", "LAB", "CONDITION", "ALLERGY", "PROCEDURE"
    status = Column(String(64), nullable=False)               # "STARTED", "DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED", "COMPLETED"
    
    raw_value = Column(String(64), nullable=True)             # "7.8"
    raw_unit = Column(String(64), nullable=True)              # "mmol/L"
    normalized_value = Column(String(64), nullable=True)      # "140.5 mg/dL"
    
    raw_date = Column(String(64), nullable=False)             # "04/05/2023"
    normalized_date = Column(String(32), nullable=False)      # "2023-05-04" (ISO-8601)
    date_status = Column(String(32), default="CONFIDENT")     # "CONFIDENT" or "AMBIGUOUS"
    
    source_doc = Column(String(256), nullable=False)          # "02_Lab_Thyrocare_2023.pdf"
    page_number = Column(Integer, default=1)                  # 1
    source_passage = Column(Text, nullable=False)             # Verbatim raw sentence from document
    
    is_reviewed = Column(Integer, default=0)                  # 0 = Machine Extracted, 1 = Clinician Reviewed
    reviewed_override = Column(Text, nullable=True)           # Clinician's override notes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="timeline_events")
    document = relationship("Document", back_populates="events")

class Contradiction(Base):
    __tablename__ = "contradictions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True, nullable=False)
    tier = Column(String(64), nullable=False)                 # "UPDATED", "NEEDS_REVIEW", "DIRECT_CONFLICT", "DUPLICATE_INVESTIGATION"
    category = Column(String(64), nullable=False)             # "MEDICATION", "ALLERGY", "LAB"
    entity = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    
    doc1_name = Column(String(256), nullable=False)
    quote1 = Column(Text, nullable=False)
    doc2_name = Column(String(256), nullable=False)
    quote2 = Column(Text, nullable=False)
    
    resolved = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="contradictions")

class ReviewAuditLog(Base):
    __tablename__ = "review_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("timeline_events.id"), nullable=False)
    reviewer_name = Column(String(128), nullable=False)
    field_modified = Column(String(64), nullable=False)
    original_value = Column(Text, nullable=False)
    new_value = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    registration_number = Column(String(64), nullable=False)
    specialisation = Column(String(128), nullable=False)
    organisation = Column(String(128), nullable=False)
    department = Column(String(128), default="Cardiology")
    queue_depth = Column(Integer, default=0)
    status = Column(String(32), default="AVAILABLE")
    phone = Column(String(32), default="+91 98765 43210")
    verified = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

