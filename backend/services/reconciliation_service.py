"""
Reconciliation Service: Evidence Conflict Radar & Duplicate Detection
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.schemas.evidence_schema import ContradictionItem, TimelineEventItem

def detect_contradictions(events: List[TimelineEventItem]) -> List[ContradictionItem]:
    """
    Scans chronologically ordered patient timeline events to flag:
    1. DIRECT_CONFLICT: Conflicting active states (e.g. Held vs Continued)
    2. NEEDS_REVIEW: Allergy discrepancy (e.g. historical NKDA vs new documented allergy)
    3. DUPLICATE_INVESTIGATION: Identical lab tests ordered within 72 hours
    4. UPDATED: Routine dosage titration over time
    """
    conflicts: List[ContradictionItem] = []
    
    # Sort events by normalized date
    sorted_events = sorted(events, key=lambda x: x.normalized_date)
    
    for i in range(len(sorted_events)):
        for j in range(i + 1, len(sorted_events)):
            e1 = sorted_events[i]
            e2 = sorted_events[j]
            
            # --- 1. Medication Conflicts ---
            if e1.category == "MEDICATION" and e2.category == "MEDICATION":
                if e1.entity.lower() == e2.entity.lower():
                    # Direct Conflict: One doc says TEMPORARILY_HELD, another says STARTED/CONTINUE close in time
                    if (e1.status == "TEMPORARILY_HELD" and e2.status == "STARTED") or \
                       (e1.status == "STARTED" and e2.status == "TEMPORARILY_HELD"):
                        conflicts.append(ContradictionItem(
                            patient_id=e1.patient_id,
                            tier="DIRECT_CONFLICT",
                            category="MEDICATION",
                            entity=e1.entity,
                            description=f"Direct contradictory state for {e1.entity}: Document '{e1.source_doc}' marked as '{e1.status}', while document '{e2.source_doc}' marked as '{e2.status}'.",
                            doc1_name=e1.source_doc,
                            quote1=e1.source_passage,
                            doc2_name=e2.source_doc,
                            quote2=e2.source_passage
                        ))
                    elif e1.status == "STARTED" and e2.status == "DOSE_CHANGED":
                        conflicts.append(ContradictionItem(
                            patient_id=e1.patient_id,
                            tier="UPDATED",
                            category="MEDICATION",
                            entity=e1.entity,
                            description=f"Dose titration: {e1.entity} adjusted from {e1.raw_value}{e1.raw_unit} to {e2.raw_value}{e2.raw_unit}.",
                            doc1_name=e1.source_doc,
                            quote1=e1.source_passage,
                            doc2_name=e2.source_doc,
                            quote2=e2.source_passage
                        ))
                        
            # --- 2. Allergy Evolution ---
            if (e1.category == "ALLERGY" or "nkda" in e1.entity.lower()) and e2.category == "ALLERGY":
                if "nkda" in e1.entity.lower() and "allergy" in e2.entity.lower():
                    conflicts.append(ContradictionItem(
                        patient_id=e1.patient_id,
                        tier="NEEDS_REVIEW",
                        category="ALLERGY",
                        entity=e2.entity,
                        description=f"Allergy status changed: Prior document documented '{e1.entity}', but subsequent document recorded '{e2.entity}'.",
                        doc1_name=e1.source_doc,
                        quote1=e1.source_passage,
                        doc2_name=e2.source_doc,
                        quote2=e2.source_passage
                    ))
                    
            # --- 3. Duplicate Investigations within 72 Hours ---
            if e1.category == "LAB" and e2.category == "LAB":
                if e1.entity.lower() == e2.entity.lower():
                    try:
                        d1 = datetime.fromisoformat(e1.normalized_date[:10])
                        d2 = datetime.fromisoformat(e2.normalized_date[:10])
                        hours_diff = abs((d2 - d1).total_seconds()) / 3600.0
                        
                        if hours_diff <= 72 and e1.source_doc != e2.source_doc:
                            conflicts.append(ContradictionItem(
                                patient_id=e1.patient_id,
                                tier="DUPLICATE_INVESTIGATION",
                                category="LAB",
                                entity=e1.entity,
                                description=f"Identical investigation '{e1.entity}' repeated within {int(hours_diff)} hours ({e1.normalized_date} vs {e2.normalized_date}). Check for duplicate order.",
                                doc1_name=e1.source_doc,
                                quote1=e1.source_passage,
                                doc2_name=e2.source_doc,
                                quote2=e2.source_passage
                            ))
                    except Exception:
                        pass

    return conflicts
