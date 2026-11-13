from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TimelineEventItem(BaseModel):
    id: Optional[int] = None
    patient_id: int
    document_id: Optional[int] = None
    
    entity: str                   # e.g., "Metformin", "Fasting Blood Glucose"
    category: str                 # "MEDICATION", "LAB", "CONDITION", "ALLERGY", "PROCEDURE"
    status: str                   # "STARTED", "DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED", "COMPLETED"
    
    raw_value: Optional[str] = None       # "7.8"
    raw_unit: Optional[str] = None        # "mmol/L"
    normalized_value: Optional[str] = None# "140.5 mg/dL"
    
    raw_date: str                 # "04/05/2023"
    normalized_date: str          # "2023-05-04"
    date_status: str = "CONFIDENT"# "CONFIDENT" or "AMBIGUOUS"
    
    source_doc: str               # "02_Lab_Thyrocare_2023.pdf"
    page_number: int = 1
    source_passage: str           # Verbatim sentence from source document
    
    is_reviewed: int = 0
    reviewed_override: Optional[str] = None

class ContradictionItem(BaseModel):
    id: Optional[int] = None
    patient_id: int
    tier: str                     # "UPDATED", "NEEDS_REVIEW", "DIRECT_CONFLICT", "DUPLICATE_INVESTIGATION"
    category: str                 # "MEDICATION", "ALLERGY", "LAB"
    entity: str
    description: str
    doc1_name: str
    quote1: str
    doc2_name: str
    quote2: str
    resolved: int = 0

class ReviewOverrideRequest(BaseModel):
    reviewer_name: str
    field_modified: str
    new_value: str
    reason: Optional[str] = None

class QARequest(BaseModel):
    patient_id: int
    question: str

class CitationItem(BaseModel):
    source_doc: str
    page_number: int
    quote: str

class QAResponse(BaseModel):
    question: str
    answer: str
    status: str                   # "GROUNDED_ANSWER" or "NOT_DOCUMENTED"
    citations: List[CitationItem] = []

class ExtractionReport(BaseModel):
    patient_id: int
    document_id: int
    filename: str
    ocr_applied: bool
    events_extracted: int
    events: List[TimelineEventItem]
