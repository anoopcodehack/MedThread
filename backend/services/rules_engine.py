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


def normalize_clinical_unit(entity: str, raw_value: Optional[str], raw_unit: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not raw_value or not raw_unit:
        return raw_value, raw_unit
    try:
        val = float(raw_value.strip())
        unit = raw_unit.strip().lower()
        entity_lower = entity.lower()
        if any(g in entity_lower for g in ["glucose", "sugar", "fbg", "ppbg"]):
            if "mmol/l" in unit:
                return f"{round(val * 18.0182, 1)}", "mg/dL"
        if "cholesterol" in entity_lower or "lipid" in entity_lower or "triglyceride" in entity_lower:
            if "mmol/l" in unit:
                return f"{round(val * 38.67, 1)}", "mg/dL"
        if "creatinine" in entity_lower:
            if "umol/l" in unit or "µmol/l" in unit:
                return f"{round(val / 88.42, 2)}", "mg/dL"
    except (ValueError, TypeError):
        pass
    return raw_value, raw_unit


def normalize_date(raw_date_str: str) -> Tuple[str, str]:
    clean_date = raw_date_str.strip()
    german_match = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", clean_date)
    if german_match:
        day, month, year = int(german_match.group(1)), int(german_match.group(2)), int(german_match.group(3))
        return f"{year:04d}-{month:02d}-{day:02d}", "CONFIDENT"
    slash_match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", clean_date)
    if slash_match:
        n1, n2, year = int(slash_match.group(1)), int(slash_match.group(2)), int(slash_match.group(3))
        if n1 > 12 and n2 <= 12:
            return f"{year:04d}-{n2:02d}-{n1:02d}", "CONFIDENT"
        elif n2 > 12 and n1 <= 12:
            return f"{year:04d}-{n1:02d}-{n2:02d}", "CONFIDENT"
        else:
            return f"{year:04d}-{n2:02d}-{n1:02d}", "AMBIGUOUS"
    try:
        dt = datetime.fromisoformat(clean_date[:10])
        return dt.strftime("%Y-%m-%d"), "CONFIDENT"
    except Exception:
        return clean_date, "AMBIGUOUS"
