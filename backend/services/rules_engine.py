"""
Deterministic Clinical Rules Engine
Implements:
1. Non-linear Medication Lifecycle Finite State Machine (FSM)
2. Deterministic Unit Math Normalizer (mmol/L -> mg/dL, etc.)
3. Date Locality & Ambiguity Normalizer
"""

import re
from datetime import datetime
from typing import Tuple, Optional

# Valid transitions in the Clinical Medication Lifecycle
VALID_MEDICATION_TRANSITIONS = {
    "STARTED": ["DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED"],
    "DOSE_CHANGED": ["DOSE_CHANGED", "TEMPORARILY_HELD", "DISCONTINUED"],
    "TEMPORARILY_HELD": ["STARTED", "DISCONTINUED"],  # Resume or permanently stop
    "DISCONTINUED": ["STARTED"]                        # Can be re-prescribed in the future
}

def validate_fsm_transition(current_status: Optional[str], new_status: str) -> bool:
    """
    Validates if transitioning a medication from current_status to new_status is clinically permissible.
    """
    if not current_status:
        return True
    allowed = VALID_MEDICATION_TRANSITIONS.get(current_status.upper(), [])
    return new_status.upper() in allowed

def normalize_clinical_unit(entity: str, raw_value: Optional[str], raw_unit: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Deterministically normalizes laboratory test values and units into standard US/International conventions.
    Never uses AI for mathematical conversion.
    """
    if not raw_value or not raw_unit:
        return raw_value, raw_unit
        
    try:
        val = float(raw_value.strip())
        unit = raw_unit.strip().lower()
        entity_lower = entity.lower()
        
        # Blood Glucose conversion: mmol/L to mg/dL
        if any(g in entity_lower for g in ["glucose", "sugar", "fbg", "ppbg"]):
            if "mmol/l" in unit:
                converted_val = round(val * 18.0182, 1)
                return f"{converted_val}", "mg/dL"
                
        # Total / HDL / LDL Cholesterol conversion: mmol/L to mg/dL
        if "cholesterol" in entity_lower or "lipid" in entity_lower or "triglyceride" in entity_lower:
            if "mmol/l" in unit:
                converted_val = round(val * 38.67, 1)
                return f"{converted_val}", "mg/dL"
                
        # Creatinine conversion: umol/L to mg/dL
        if "creatinine" in entity_lower:
            if "umol/l" in unit or "µmol/l" in unit:
                converted_val = round(val / 88.42, 2)
                return f"{converted_val}", "mg/dL"
                
    except (ValueError, TypeError):
        pass
        
    return raw_value, raw_unit

def normalize_date(raw_date_str: str) -> Tuple[str, str]:
    """
    Normalizes clinical date string into ISO-8601 (YYYY-MM-DD).
    Flags date_status as 'CONFIDENT' or 'AMBIGUOUS' (e.g. 04/05/2023 where Day and Month could be inverted).
    """
    clean_date = raw_date_str.strip()
    
    # German format: DD.MM.YYYY
    german_match = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", clean_date)
    if german_match:
        day, month, year = int(german_match.group(1)), int(german_match.group(2)), int(german_match.group(3))
        return f"{year:04d}-{month:02d}-{day:02d}", "CONFIDENT"
        
    # Slash format: DD/MM/YYYY or MM/DD/YYYY
    slash_match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", clean_date)
    if slash_match:
        n1, n2, year = int(slash_match.group(1)), int(slash_match.group(2)), int(slash_match.group(3))
        
        # If n1 > 12, it must be DD/MM/YYYY
        if n1 > 12 and n2 <= 12:
            return f"{year:04d}-{n2:02d}-{n1:02d}", "CONFIDENT"
        # If n2 > 12, it must be MM/DD/YYYY
        elif n2 > 12 and n1 <= 12:
            return f"{year:04d}-{n1:02d}-{n2:02d}", "CONFIDENT"
        else:
            # Ambiguous date (both <= 12). Default to DD/MM/YYYY for Indian/UK medical conventions
            return f"{year:04d}-{n2:02d}-{n1:02d}", "AMBIGUOUS"
            
    # ISO fallback
    try:
        dt = datetime.fromisoformat(clean_date[:10])
        return dt.strftime("%Y-%m-%d"), "CONFIDENT"
    except Exception:
        return clean_date, "AMBIGUOUS"
