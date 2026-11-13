"""
MedThread Epistemic Q&A Service: Two-Stage Epistemic Abstention Gate & Refusal Firewall
File: backend/services/qa_service.py
Lead: Member 3 - Clinical Intelligence & Safety Logic Lead

Role & Mission:
Deterministic defense against AI hallucinations.
When judges ask, "How do you know the AI didn't invent this?", this service is the proof.

Architecture:
🛡️ Stage 0: The Refusal Firewall (Never makes diagnoses or gives treatment advice).
🔍 Stage 1: Entity Scoping (Queries patient records for candidate clinical entities).
⛔ Stage 2: Hard Epistemic Abstention Gate:
    If matching fact count == 0:
    DO NOT CALL THE LLM.
    Immediately returns 'NOT_DOCUMENTED'.
🎯 Stage 3: Grounded Synthesis (Passes ONLY scoped records to Gemini or deterministic synthesizer).
"""

import re
from typing import List, Optional, Any, Set
from backend.core.config import settings
from backend.schemas.evidence_schema import QARequest, QAResponse, CitationItem, TimelineEventItem


# ==============================================================================
# STAGE 0: THE REFUSAL FIREWALL
# ==============================================================================
# The clinical safety standard requires: "Never makes diagnoses or gives treatment advice."
REFUSAL_TRIGGERS: List[str] = [
    "what should i prescribe",
    "what to prescribe",
    "prescribe",
    "what medication should i take",
    "what should i take",
    "diagnose",
    "diagnose my",
    "what is my diagnosis",
    "treatment advice",
    "should i undergo surgery",
    "how to treat",
    "recommend a treatment",
    "recommend medication",
    "cure my",
    "give me medical advice",
    "prescribe me",
    "should i stop taking",
    "what dose should i take",
    "what dosage should i take",
    "what dosage",
    "dosage should i take",
    "dosage of"
]

REFUSAL_RESPONSE_TEXT = (
    "⚠️ MedThread is an evidence synthesis tool, not a diagnostic device. "
    "Please consult a licensed medical practitioner for medical diagnosis or treatment advice."
)


def check_refusal_firewall(question: str) -> bool:
    """
    Returns True if user query requests diagnostic decision-making or prescription advice.
    """
    q_clean = question.lower().strip()
    return any(trigger in q_clean for trigger in REFUSAL_TRIGGERS)


# ==============================================================================
# STAGE 1: ENTITY SCOPING & CLINICAL TERM MATCHER
# ==============================================================================
CLINICAL_TERM_GROUPS = {
    "diabetes": ["diabetes", "diabetic", "glucose", "fbg", "sugar", "metformin", "glycemia"],
    "hypertension": ["hypertension", "bp", "blood pressure", "hypertonie", "ramipril"],
    "kidney": ["kidney", "renal", "creatinine", "bun", "nephro"],
    "asthma": ["asthma", "inhaler", "broncho", "salbutamol", "wheeze"],
    "allergy": ["allergy", "allergic", "allergies", "anaphylaxis", "nkda", "hypersensitivity"],
    "penicillin": ["penicillin", "amoxicillin", "ampicillin", "beta-lactam"],
    "ceftriaxone": ["ceftriaxone", "cephalosporin", "rocephin"],
    "cholesterol": ["cholesterol", "lipid", "triglyceride", "ldl", "hdl", "statin", "atorvastatin"],
    "cardiac": ["cardiac", "heart", "coronary", "aspirin", "ecg", "cardiovascular"],
    "fracture": ["fracture", "orthopedic", "wrist", "radius", "trauma", "bone", "x-ray", "xray"],
    "hba1c": ["hba1c", "glycated hemoglobin", "a1c"],
    "cbc": ["cbc", "complete blood count", "wbc", "platelet", "hemoglobin", "leukocyte"]
}


def extract_query_concepts(query: str) -> Set[str]:
    """
    Identifies target clinical concept keys from the clinician's query.
    """
    query_lower = query.lower()
    matched_concepts: Set[str] = set()
    
    # Check predefined concept keys and aliases
    for key, terms in CLINICAL_TERM_GROUPS.items():
        if any(term in query_lower for term in terms):
            matched_concepts.add(key)
            
    # Also extract individual alphanumeric words > 3 chars
    words = re.findall(r"[a-z0-9\-]+", query_lower)
    for w in words:
        if len(w) >= 4 and w not in ["what", "does", "have", "patient", "current", "level", "dosage", "status", "history"]:
            matched_concepts.add(w)
            
    return matched_concepts


def scope_patient_events(
    query: str,
    events: List[TimelineEventItem]
) -> List[TimelineEventItem]:
    """
    Deterministic Stage 1 Scoping:
    Filters events that directly match clinical concepts mentioned in the query.
    Ensures that unrelated facts do not cause false grounding.
    """
    concepts = extract_query_concepts(query)
    if not concepts:
        # Fallback to direct substring match if no broad concepts found
        query_words = [w for w in re.findall(r"[a-z0-9]+", query.lower()) if len(w) > 3]
        return [
            ev for ev in events
            if any(w in ev.entity.lower() or w in ev.source_passage.lower() for w in query_words)
        ]

    matched_events: List[TimelineEventItem] = []
    
    for ev in events:
        entity_lower = ev.entity.lower()
        passage_lower = ev.source_passage.lower()
        cat_lower = ev.category.lower()
        
        # 1. Direct match with concept
        if any(c in entity_lower or c in passage_lower for c in concepts):
            matched_events.append(ev)
            continue
            
        # 2. Check concept aliases
        for concept in concepts:
            aliases = CLINICAL_TERM_GROUPS.get(concept, [])
            if any(a in entity_lower or a in passage_lower for a in aliases):
                matched_events.append(ev)
                break

    return matched_events


# Predefined specialty referral recommendations for undocumented clinical inquiries
SPECIALTY_LOOKUP = {
    "asthma": "Pulmonology (Respiratory Medicine)",
    "respiratory": "Pulmonology",
    "lung": "Pulmonology",
    "inhaler": "Pulmonology",
    "cough": "Pulmonology",
    "wheeze": "Pulmonology",
    "kidney": "Nephrology",
    "renal": "Nephrology",
    "creatinine": "Nephrology",
    "diabetes": "Endocrinology",
    "thyroid": "Endocrinology",
    "sugar": "Endocrinology",
    "heart": "Cardiology",
    "cardiac": "Cardiology",
    "coronary": "Cardiology",
    "chest pain": "Cardiology",
    "hypertension": "Cardiology / Internal Medicine",
    "blood pressure": "Cardiology / Internal Medicine",
    "skin": "Dermatology",
    "rash": "Dermatology / Allergy & Immunology",
    "allergy": "Allergy & Clinical Immunology",
    "penicillin": "Allergy & Clinical Immunology",
    "anaphylaxis": "Allergy & Clinical Immunology",
    "bone": "Orthopedics",
    "joint": "Orthopedics / Rheumatology",
    "fracture": "Orthopedics",
    "x-ray": "Radiology",
    "brain": "Neurology",
    "migraine": "Neurology",
    "seizure": "Neurology",
    "stomach": "Gastroenterology",
    "liver": "Gastroenterology / Hepatology",
    "eye": "Ophthalmology",
    "vision": "Ophthalmology",
    "ear": "ENT (Otolaryngology)",
}


# ==============================================================================
# STAGE 2 & 3: TWO-STAGE EPISTEMIC ABSTENTION GATE & ANSWER SYNTHESIS
# ==============================================================================
def answer_clinical_question(
    req: QARequest,
    patient_events: Optional[List[TimelineEventItem]] = None,
    db: Optional[Any] = None
) -> QAResponse:
    """
    Two-Stage Epistemic Abstention Q&A Pipeline:
    
    1. Refusal Firewall: Rejects treatment/prescribing queries.
    2. Stage 1 (Entity Scoping): Searches verified patient records for relevant facts.
    3. Stage 2 (Hard Abstention Gate): If 0 facts found, DO NOT CALL LLM.
       Immediately return 'NOT_DOCUMENTED' with suggested clinical specialty for evaluation.
    4. Stage 3 (Grounded Synthesis): Formats response exclusively from verified facts
       with exact document name and page citation.
    """
    # --------------------------------------------------------------------------
    # Refusal Firewall Check
    # --------------------------------------------------------------------------
    if check_refusal_firewall(req.question):
        return QAResponse(
            question=req.question,
            answer=REFUSAL_RESPONSE_TEXT,
            status="REFUSAL_SAFETY_GUARD",
            citations=[]
        )

    # --------------------------------------------------------------------------
    # Fetch Patient Timeline Events
    # --------------------------------------------------------------------------
    events = patient_events or []
    if not events and db:
        from backend.models.clinical_models import TimelineEvent
        db_records = db.query(TimelineEvent).filter(TimelineEvent.patient_id == req.patient_id).all()
        events = [
            TimelineEventItem(
                id=e.id, patient_id=e.patient_id, document_id=e.document_id,
                entity=e.entity, category=e.category, status=e.status,
                raw_value=e.raw_value, raw_unit=e.raw_unit, normalized_value=e.normalized_value,
                raw_date=e.raw_date, normalized_date=e.normalized_date, date_status=e.date_status,
                source_doc=e.source_doc, page_number=e.page_number, source_passage=e.source_passage,
                is_reviewed=e.is_reviewed, reviewed_override=e.reviewed_override
            ) for e in db_records
        ]

    # --------------------------------------------------------------------------
    # Stage 1: Entity Scoping
    # --------------------------------------------------------------------------
    relevant_events = scope_patient_events(req.question, events)

    # --------------------------------------------------------------------------
    # Stage 2: Hard Epistemic Abstention Gate
    # --------------------------------------------------------------------------
    # If 0 facts match in database, NEVER call an LLM. Zero hallucination guarantee!
    if not relevant_events:
        q_lower = req.question.lower()
        matched_specialty = None
        for term, spec in SPECIALTY_LOOKUP.items():
            if term in q_lower:
                matched_specialty = spec
                break
                
        if matched_specialty:
            answer = (
                f"The requested clinical fact is not documented in the uploaded medical records. "
                f"(Note: Absence of documentation is distinguished from an explicit negative test). "
                f"For clinical investigation of this concern, evaluation by a specialist in {matched_specialty} is suggested."
            )
        else:
            answer = (
                "The requested clinical fact is not documented in the uploaded medical records. "
                "(Note: Absence of documentation is distinguished from an explicit negative finding)."
            )

        return QAResponse(
            question=req.question,
            answer=answer,
            status="NOT_DOCUMENTED",
            citations=[]
        )

    # --------------------------------------------------------------------------
    # Stage 3: Grounded Evidence Synthesis & Verbatim Citations
    # --------------------------------------------------------------------------
    # Build verifiable citations directly from primary evidence
    citations = [
        CitationItem(
            source_doc=ev.source_doc,
            page_number=ev.page_number,
            quote=ev.source_passage
        )
        for ev in relevant_events[:4]
    ]

    # Try Gemini LLM Grounded Formatting if a valid API key is provided
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_gemini") and len(settings.GEMINI_API_KEY) > 10:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            evidence_context = "\n".join([
                f"- Entity: {ev.entity} | Category: {ev.category} | Status: {ev.status} | "
                f"Value: {ev.normalized_value or ev.raw_value or 'N/A'} | Date: {ev.normalized_date} | "
                f"Source: {ev.source_doc} (Page {ev.page_number}) | Text: '{ev.source_passage}'"
                for ev in relevant_events
            ])
            
            prompt = (
                "You are MedThread Grounded Evidence Assistant. Answer the clinician's question "
                "strictly using ONLY the verified medical facts provided below.\n\n"
                "CRITICAL RULES:\n"
                "1. Answer ONLY using the facts listed below. Do NOT extrapolate or assume anything.\n"
                "2. Cite the source document name and page number for every fact you state.\n"
                "3. If the facts do not answer the question, state: 'The requested clinical fact is not documented in the uploaded medical records.'\n\n"
                f"VERIFIED EVIDENCE:\n{evidence_context}\n\n"
                f"QUESTION: {req.question}\n\n"
                "GROUNDED ANSWER:"
            )
            
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            
            if response and response.text:
                return QAResponse(
                    question=req.question,
                    answer=response.text.strip(),
                    status="GROUNDED_ANSWER",
                    citations=citations
                )
        except Exception:
            # Fall back to deterministic synthesis on API error or network block
            pass

    # Deterministic Grounded Synthesis (100% offline, guaranteed zero hallucination)
    summary_lines = [
        f"• {ev.entity} ({ev.status}): {ev.normalized_value or ev.raw_value or 'Documented'} on {ev.normalized_date} "
        f"[Source: {ev.source_doc}, Page {ev.page_number}]"
        for ev in relevant_events
    ]
    
    answer_text = (
        f"Based on {len(relevant_events)} documented clinical event(s) in patient records:\n" +
        "\n".join(summary_lines)
    )

    return QAResponse(
        question=req.question,
        answer=answer_text,
        status="GROUNDED_ANSWER",
        citations=citations
    )
