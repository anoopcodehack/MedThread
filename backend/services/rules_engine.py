"""
MedThread Clinical Intelligence & Safety Logic Engine
File: backend/services/rules_engine.py
Lead: Member 3 - Clinical Intelligence & Safety Logic Lead

Role & Mission:
Deterministic, non-LLM clinical safety logic. Defends against AI hallucinations
and computational errors. Implements:
1. Non-linear Medication Finite State Machine (FSM)
2. Deterministic Unit Math Normalizer (Never use LLMs for arithmetic!)
3. Medication Lifecycle & Active Status Audit Tracker
4. Clinical Date Normalization & Ambiguity Detection
"""

import re
from datetime import datetime
from typing import Tuple, Optional, Dict, Any, List

# ==============================================================================
# 1. NON-LINEAR MEDICATION FINITE STATE MACHINE (FSM)
# ==============================================================================
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "STARTED": ["DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED"],
    "DOSE_CHANGED": ["DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED"],
    "TEMPORARILY_HELD": ["STARTED", "DISCONTINUED"],  # Resumed post-surgery or stopped
    "DISCONTINUED": ["STARTED"]                        # Re-prescribed in the future
}

# Backward compatibility alias
VALID_MEDICATION_TRANSITIONS = VALID_TRANSITIONS

FSM_ERROR_RATIONALES: Dict[Tuple[str, str], str] = {
    ("TEMPORARILY_HELD", "DOSE_CHANGED"): "Cannot titrate dose while medication is temporarily held; must be resumed (STARTED) first.",
    ("DISCONTINUED", "DOSE_CHANGED"): "Cannot modify dose of a discontinued medication without a new prescription order (STARTED).",
    ("DISCONTINUED", "TEMPORARILY_HELD"): "Cannot temporarily hold a medication that is already permanently discontinued.",
    ("TEMPORARILY_HELD", "TEMPORARILY_HELD"): "Medication is already on hold; redundant hold order detected."
}


def validate_fsm_transition(current_status: Optional[str], new_status: str) -> bool:
    """
    Validates if transitioning a medication from current_status to new_status
    follows deterministic clinical lifecycle rules.
    """
    if not current_status:
        return new_status.upper() in ["STARTED", "RECORDED", "COMPLETED", "DIAGNOSED", "DOSE_CHANGED", "TEMPORARILY_HELD"]
        
    curr = current_status.upper().strip()
    nxt = new_status.upper().strip()
    
    if curr not in VALID_TRANSITIONS:
        return True
        
    allowed_next_states = VALID_TRANSITIONS.get(curr, [])
    return nxt in allowed_next_states


def check_fsm_transition_detail(current_status: Optional[str], new_status: str) -> Tuple[bool, str]:
    """
    Detailed clinical audit of an FSM transition with explicit rationale.
    Returns (is_valid, clinical_rationale).
    """
    if not current_status:
        return True, f"Initial medication registration as '{new_status}'."
        
    curr = current_status.upper().strip()
    nxt = new_status.upper().strip()
    
    if curr == nxt:
        return True, f"Medication maintains current state '{curr}'."
        
    allowed = VALID_TRANSITIONS.get(curr, [])
    if nxt in allowed:
        return True, f"Valid clinical transition from '{curr}' to '{nxt}'."
        
    rationale = FSM_ERROR_RATIONALES.get(
        (curr, nxt),
        f"Invalid clinical transition from '{curr}' to '{nxt}'. Permitted transitions: {allowed}"
    )
    return False, rationale


def get_valid_next_states(current_status: str) -> List[str]:
    """
    Returns allowable subsequent medication states for clinical workflow UI.
    """
    return VALID_TRANSITIONS.get(current_status.upper().strip(), [])


def audit_medication_state(events: List[Any]) -> Dict[str, Dict[str, Any]]:
    """
    Given all chronological timeline events for a patient:
    Aggregates medication histories to compute current active/stopped status.
    Guarantees that a medication stopped years ago is NEVER reported as current.
    """
    med_events = [e for e in events if getattr(e, "category", "") == "MEDICATION"]
    sorted_meds = sorted(med_events, key=lambda x: getattr(x, "normalized_date", "") or "")
    
    medications: Dict[str, Dict[str, Any]] = {}
    
    for ev in sorted_meds:
        raw_entity = getattr(ev, "entity", "").strip()
        clean_name = re.sub(r"^(?:Tab\.?|Cap\.?|Inj\.?|Syrup)\s*", "", raw_entity, flags=re.IGNORECASE).strip()
        clean_name = clean_name.split()[0].capitalize() if clean_name else "Unknown"
        
        status = getattr(ev, "status", "STARTED").upper()
        norm_val = getattr(ev, "normalized_value", None) or f"{getattr(ev, 'raw_value', '')} {getattr(ev, 'raw_unit', '')}".strip()
        date_str = getattr(ev, "normalized_date", "")
        doc_str = getattr(ev, "source_doc", "")
        passage_str = getattr(ev, "source_passage", "")
        
        if clean_name not in medications:
            medications[clean_name] = {
                "entity": clean_name,
                "current_status": status,
                "is_active": status in ["STARTED", "DOSE_CHANGED"],
                "is_temporarily_held": status == "TEMPORARILY_HELD",
                "is_discontinued": status == "DISCONTINUED",
                "latest_dosage": norm_val,
                "latest_date": date_str,
                "latest_source_doc": doc_str,
                "latest_passage": passage_str,
                "transition_history": [
                    {"status": status, "dosage": norm_val, "date": date_str, "doc": doc_str}
                ]
            }
        else:
            prev = medications[clean_name]
            prev_status = prev["current_status"]
            is_valid, _ = check_fsm_transition_detail(prev_status, status)
            
            prev["current_status"] = status
            prev["is_active"] = status in ["STARTED", "DOSE_CHANGED"]
            prev["is_temporarily_held"] = (status == "TEMPORARILY_HELD")
            prev["is_discontinued"] = (status == "DISCONTINUED")
            if norm_val:
                prev["latest_dosage"] = norm_val
            prev["latest_date"] = date_str
            prev["latest_source_doc"] = doc_str
            prev["latest_passage"] = passage_str
            prev["transition_history"].append({
                "status": status,
                "dosage": norm_val,
                "date": date_str,
                "doc": doc_str,
                "valid_transition": is_valid
            })
            
    return medications


def get_active_medications(events: List[Any]) -> List[Dict[str, Any]]:
    med_state = audit_medication_state(events)
    return [info for info in med_state.values() if info["is_active"]]


def get_stopped_medications(events: List[Any]) -> List[Dict[str, Any]]:
    med_state = audit_medication_state(events)
    return [info for info in med_state.values() if info["is_discontinued"]]


# ==============================================================================
# 2. DETERMINISTIC CLINICAL UNIT NORMALIZATION (Never use LLMs for Math!)
# ==============================================================================
def normalize_clinical_unit(
    entity: str,
    raw_value: Optional[str],
    raw_unit: Optional[str]
) -> Tuple[Optional[str], Optional[str]]:
    """
    Deterministically normalizes laboratory test values and units into standard
    US/International conventions.
    Never uses AI for mathematical conversion.
    """
    if not raw_value or not raw_unit:
        return raw_value, raw_unit
        
    try:
        clean_val_str = str(raw_value).strip().replace(",", ".")
        val = float(clean_val_str)
        unit = str(raw_unit).strip().lower()
        entity_lower = entity.lower()
        
        # 1. Fasting Blood Glucose / Sugar (mmol/L -> mg/dL)
        if any(term in entity_lower for term in ["glucose", "sugar", "fbg", "ppbg", "glycemia"]):
            if "mmol/l" in unit:
                converted_val = round(val * 18.0182, 1)
                return f"{converted_val}", "mg/dL"
            elif "mg/dl" in unit:
                return f"{round(val, 1)}", "mg/dL"
                
        # 2. Total / LDL / HDL Cholesterol & Triglycerides (mmol/L -> mg/dL)
        if any(term in entity_lower for term in ["cholesterol", "lipid", "triglyceride", "ldl", "hdl"]):
            if "mmol/l" in unit:
                converted_val = round(val * 38.67, 1)
                return f"{converted_val}", "mg/dL"
            elif "mg/dl" in unit:
                return f"{round(val, 1)}", "mg/dL"
                
        # 3. Serum Creatinine (umol/L -> mg/dL)
        if "creatinine" in entity_lower:
            if any(u in unit for u in ["umol/l", "µmol/l", "micromol/l", "umol/l."]):
                converted_val = round(val / 88.42, 2)
                return f"{converted_val}", "mg/dL"
            elif "mg/dl" in unit:
                return f"{round(val, 2)}", "mg/dL"
                
        # 4. Complete Blood Count (CBC) / White Blood Cell Count (/mcL, /uL)
        if any(term in entity_lower for term in ["wbc", "white blood", "leukocyte"]):
            if any(u in unit for u in ["/mcl", "/ul", "/mm3", "cells/mcl", "cells/ul"]):
                return f"{int(round(val))}", "/mcL"
                
    except (ValueError, TypeError):
        pass
        
    return raw_value, raw_unit


def format_dual_unit(
    raw_value: Optional[str],
    raw_unit: Optional[str],
    normalized_value: Optional[str],
    normalized_unit: Optional[str]
) -> str:
    """
    Dual-Unit Display:
    Formats evidence with both standardized and raw provenance:
    e.g. '140.5 mg/dL (raw: 7.8 mmol/L)'
    """
    if not normalized_value:
        return f"{raw_value or ''} {raw_unit or ''}".strip()
        
    norm_str = f"{normalized_value} {normalized_unit or ''}".strip()
    if raw_value and raw_unit and (raw_unit.lower() != (normalized_unit or "").lower()):
        return f"{norm_str} (raw: {raw_value} {raw_unit})"
    return norm_str


# ==============================================================================
# 3. DETERMINISTIC DATE NORMALIZATION & AMBIGUITY DETECTION
# ==============================================================================
MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12
}


def normalize_date(raw_date_str: str) -> Tuple[str, str]:
    """
    Normalizes clinical date string into ISO-8601 (YYYY-MM-DD).
    Flags date_status as 'CONFIDENT' or 'AMBIGUOUS'.
    """
    clean_date = raw_date_str.strip()
    
    # German dot format: DD.MM.YYYY
    german_match = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", clean_date)
    if german_match:
        day = int(german_match.group(1))
        month = int(german_match.group(2))
        year = int(german_match.group(3))
        if 1 <= month <= 12 and 1 <= day <= 31:
            return f"{year:04d}-{month:02d}-{day:02d}", "CONFIDENT"
            
    # Text month format: '15 Jan 2022', '10 June 2024', '14-Sep-2021'
    text_match = re.match(r"^(\d{1,2})[-/\s]+([a-zA-Z]+)[-/\s]+(\d{4})$", clean_date)
    if text_match:
        day = int(text_match.group(1))
        month_name = text_match.group(2).lower()
        year = int(text_match.group(3))
        month_num = MONTH_MAP.get(month_name[:3])
        if month_num and 1 <= day <= 31:
            return f"{year:04d}-{month_num:02d}-{day:02d}", "CONFIDENT"
            
    # Slash / Dash format: DD/MM/YYYY or MM/DD/YYYY
    slash_match = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})", clean_date)
    if slash_match:
        n1 = int(slash_match.group(1))
        n2 = int(slash_match.group(2))
        year = int(slash_match.group(3))
        if n1 > 12 and n2 <= 12:
            return f"{year:04d}-{n2:02d}-{n1:02d}", "CONFIDENT"
        elif n2 > 12 and n1 <= 12:
            return f"{year:04d}-{n1:02d}-{n2:02d}", "CONFIDENT"
        else:
            return f"{year:04d}-{n2:02d}-{n1:02d}", "AMBIGUOUS"
            
    # Standard ISO-8601 format: YYYY-MM-DD
    iso_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", clean_date)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}", "CONFIDENT"
        
    try:
        dt = datetime.fromisoformat(clean_date[:10])
        return dt.strftime("%Y-%m-%d"), "CONFIDENT"
    except Exception:
        return clean_date, "AMBIGUOUS"
