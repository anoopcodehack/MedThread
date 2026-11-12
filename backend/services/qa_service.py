"""
Two-Stage Epistemic Abstention Q&A Service
Answers questions ONLY from verifiable evidence extracted from patient records.
If evidence is missing, returns explicit 'NOT_DOCUMENTED' status.
"""

from typing import List, Dict, Any
from backend.schemas.evidence_schema import QARequest, QAResponse, CitationItem, TimelineEventItem

def answer_clinical_question(req: QARequest, patient_events: List[TimelineEventItem]) -> QAResponse:
    """
    Two-stage retrieval and abstention pipeline:
    1. Filter patient timeline events matching entities mentioned in the query.
    2. If no matching entities exist in patient's records, abstain immediately with NOT_DOCUMENTED.
    3. If matching entities exist, construct grounded response with verbatim source citations.
    """
    query_lower = req.question.lower()
    relevant_events = []
    
    for event in patient_events:
        if event.entity.lower() in query_lower or event.category.lower() in query_lower:
            relevant_events.append(event)
            
    # Epistemic Abstention Gate: Refuse to invent facts if entity is not documented
    if not relevant_events:
        return QAResponse(
            question=req.question,
            answer="The requested clinical fact is not documented in the uploaded medical records.",
            status="NOT_DOCUMENTED",
            citations=[]
        )
        
    # Construct grounded citations
    citations = [
        CitationItem(
            source_doc=ev.source_doc,
            page_number=ev.page_number,
            quote=ev.source_passage
        )
        for ev in relevant_events[:3]
    ]
    
    summary = f"Based on {len(relevant_events)} documented event(s): " + "; ".join(
        [f"{ev.entity} ({ev.status}) on {ev.normalized_date}" for ev in relevant_events]
    )
    
    return QAResponse(
        question=req.question,
        answer=summary,
        status="GROUNDED_ANSWER",
        citations=citations
    )
