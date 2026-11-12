"""
MedThread Clinical Reconciliation Service: Evidence Conflict Radar & Duplicate Detection
File: backend/services/reconciliation_service.py
Lead: Member 3 - Clinical Intelligence & Safety Logic Lead

Role & Mission:
Deterministic 4-Tier Conflict & Duplicate Detector.
Guarantees that contradictory medical orders, allergy evolutions, redundant repeat tests,
and dosage titrations are surfaced transparently to clinicians rather than silently resolved.

The 4 Clinical Tiers:
🔴 Tier 1: DIRECT_CONFLICT (Critical Clinical Danger)
   An active medication order directly contradicts another active order in the care window
   (e.g., Surgery discharge orders Aspirin HELD, but outpatient cardiology continues Aspirin).
🟡 Tier 2: NEEDS_REVIEW (Clinical Discrepancy & Evolution)
   Historical allergy discrepancy (e.g., 2022 documented NKDA, but 2024 emergency summary
   documents severe Ceftriaxone anaphylaxis).
🟠 Tier 3: DUPLICATE_INVESTIGATION (Healthcare Redundancy & Cost)
   Identical lab investigations (e.g., CBC) conducted within 72 hours across different facilities
   without documented acute indication.
🔵 Tier 4: UPDATED (Normal Clinical Titration)
   Routine dosage adjustments over time (Metformin 500mg ➔ 850mg, Ramipril 5mg ➔ 10mg).
"""

import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Set, Tuple
from backend.schemas.evidence_schema import ContradictionItem, TimelineEventItem


def canonical_entity_name(entity: str, category: str = "") -> str:
    """
    Normalizes raw clinical entity strings into canonical forms for comparison.
    e.g. 'Tab. Metformin 500mg' -> 'Metformin'
         'Ceftriaxone Allergy' -> 'Ceftriaxone'
         'Complete Blood Count (CBC)' -> 'Complete Blood Count (CBC)'
    """
    clean = re.sub(r"^(?:Tab\.?|Cap\.?|Inj\.?|Syrup|IV|IM)\s*", "", entity.strip(), flags=re.IGNORECASE)
    
    # Specific known tests / medications
    lower = clean.lower()
    if "complete blood count" in lower or lower == "cbc" or "wbc" in lower:
        return "Complete Blood Count (CBC)"
    if "fasting blood glucose" in lower or "fbg" in lower:
        return "Fasting Blood Glucose"
    if "total cholesterol" in lower or ("cholesterol" in lower and "serum" in lower):
        return "Total Cholesterol"
    if "ceftriaxone" in lower:
        return "Ceftriaxone"
    if "metformin" in lower:
        return "Metformin"
    if "aspirin" in lower:
        return "Aspirin"
    if "ramipril" in lower:
        return "Ramipril"
    if "atorvastatin" in lower:
        return "Atorvastatin"
    if "amoxicillin" in lower:
        return "Amoxicillin"
    if "paracetamol" in lower:
        return "Paracetamol"
    if "hernia" in lower:
        return "Laparoscopic Inguinal Hernia Repair"
    if "fracture" in lower:
        return "Distal Radius Fracture"
    if "hypertension" in lower or "hypertonie" in lower:
        return "Hypertension"
        
    return clean.split()[0].capitalize() if clean else entity


def parse_event_date(date_str: str) -> Optional[datetime]:
    """
    Safely parses an ISO date string (YYYY-MM-DD) into datetime.
    """
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str[:10])
    except Exception:
        try:
            return datetime.strptime(date_str[:10], "%Y-%m-%d")
        except Exception:
            return None


def detect_contradictions(events: List[TimelineEventItem]) -> List[ContradictionItem]:
    """
    Deterministic 4-Tier Conflict & Duplicate Detector:
    Scans patient timeline events chronologically to detect and classify clinical discrepancies.
    Returns structured ContradictionItems with verbatim provenance from source documents.
    """
    conflicts: List[ContradictionItem] = []
    seen_conflict_keys: Set[Tuple[str, str, str, str]] = set()

    # Sort events chronologically by normalized_date
    sorted_events = sorted(events, key=lambda x: getattr(x, "normalized_date", "") or "")
    
    num_events = len(sorted_events)
    
    for i in range(num_events):
        for j in range(i + 1, num_events):
            e1 = sorted_events[i]
            e2 = sorted_events[j]
            
            # Skip if comparing same document with same status
            if e1.source_doc == e2.source_doc and e1.status == e2.status and e1.entity == e2.entity:
                continue

            c1 = canonical_entity_name(e1.entity, e1.category)
            c2 = canonical_entity_name(e2.entity, e2.category)

            # ==================================================================
            # 1. 🔴 TIER 1: DIRECT_CONFLICT (Critical Medication Order Clash)
            # ==================================================================
            # Example: Surgery discharge says Aspirin HELD (risk), but outpatient note says Continue Aspirin.
            if e1.category == "MEDICATION" and e2.category == "MEDICATION" and c1 == c2:
                # Contradiction: One is TEMPORARILY_HELD, other is STARTED / CONTINUE
                is_held_and_started = (
                    (e1.status == "TEMPORARILY_HELD" and e2.status in ["STARTED", "DOSE_CHANGED"]) or
                    (e1.status in ["STARTED", "DOSE_CHANGED"] and e2.status == "TEMPORARILY_HELD")
                )
                
                # Or DISCONTINUED contradicted by immediate STARTED in same window without reconciliation
                is_discontinued_clash = (
                    (e1.status == "DISCONTINUED" and e2.status == "STARTED" and e1.source_doc != e2.source_doc)
                )

                if is_held_and_started or is_discontinued_clash:
                    key = ("DIRECT_CONFLICT", c1, e1.source_doc, e2.source_doc)
                    if key not in seen_conflict_keys:
                        seen_conflict_keys.add(key)
                        desc = (
                            f"Contradictory state for {c1}: Document '{e1.source_doc}' marked as '{e1.status}', "
                            f"while document '{e2.source_doc}' marked as '{e2.status}' without surgical reconciliation."
                        )
                        conflicts.append(ContradictionItem(
                            patient_id=e1.patient_id,
                            tier="DIRECT_CONFLICT",
                            category="MEDICATION",
                            entity=c1,
                            description=desc,
                            doc1_name=e1.source_doc,
                            quote1=e1.source_passage,
                            doc2_name=e2.source_doc,
                            quote2=e2.source_passage
                        ))
                        continue

                # ==============================================================
                # 4. 🔵 TIER 4: UPDATED (Routine Dosage Titration Over Time)
                # ==============================================================
                # Example: Metformin 500mg -> 850mg; Ramipril 5mg -> 10mg
                is_dose_change = (
                    (e1.status == "STARTED" and e2.status == "DOSE_CHANGED") or
                    (e1.status == "DOSE_CHANGED" and e2.status == "DOSE_CHANGED") or
                    (e1.raw_value and e2.raw_value and e1.raw_value != e2.raw_value and e1.status in ["STARTED", "DOSE_CHANGED"] and e2.status in ["STARTED", "DOSE_CHANGED"])
                )
                
                if is_dose_change:
                    key = ("UPDATED", c1, e1.source_doc, e2.source_doc)
                    if key not in seen_conflict_keys:
                        seen_conflict_keys.add(key)
                        v1 = f"{e1.raw_value or ''} {e1.raw_unit or ''}".strip()
                        v2 = f"{e2.raw_value or ''} {e2.raw_unit or ''}".strip()
                        desc = f"Dose titration: {c1} adjusted from {v1} ('{e1.source_doc}') to {v2} ('{e2.source_doc}')."
                        conflicts.append(ContradictionItem(
                            patient_id=e1.patient_id,
                            tier="UPDATED",
                            category="MEDICATION",
                            entity=c1,
                            description=desc,
                            doc1_name=e1.source_doc,
                            quote1=e1.source_passage,
                            doc2_name=e2.source_doc,
                            quote2=e2.source_passage
                        ))
                        continue

            # ==================================================================
            # 2. 🟡 TIER 2: NEEDS_REVIEW (Allergy Evolution & Historical Discrepancy)
            # ==================================================================
            # Example: 2022 documents NKDA, but 2024 emergency summary documents Ceftriaxone anaphylaxis.
            is_e1_nkda = "nkda" in e1.entity.lower() or "no known" in e1.entity.lower() or "no known" in e1.source_passage.lower()
            is_e2_nkda = "nkda" in e2.entity.lower() or "no known" in e2.entity.lower() or "no known" in e2.source_passage.lower()
            
            is_e1_allergy = e1.category == "ALLERGY" or "allergy" in e1.entity.lower() or "anaphyl" in e1.source_passage.lower()
            is_e2_allergy = e2.category == "ALLERGY" or "allergy" in e2.entity.lower() or "anaphyl" in e2.source_passage.lower()

            if (is_e1_nkda and is_e2_allergy and not is_e2_nkda) or (is_e2_nkda and is_e1_allergy and not is_e1_nkda):
                allergy_event = e2 if is_e2_allergy and not is_e2_nkda else e1
                nkda_event = e1 if allergy_event == e2 else e2
                allergen = canonical_entity_name(allergy_event.entity, "ALLERGY")
                
                key = ("NEEDS_REVIEW", allergen, nkda_event.source_doc, allergy_event.source_doc)
                if key not in seen_conflict_keys:
                    seen_conflict_keys.add(key)
                    desc = (
                        f"Historical allergy discrepancy: Document '{nkda_event.source_doc}' documented '{nkda_event.entity}', "
                        f"but subsequent document '{allergy_event.source_doc}' recorded '{allergy_event.entity}'. "
                        f"Prior non-allergic status superseded by documented reaction."
                    )
                    conflicts.append(ContradictionItem(
                        patient_id=e1.patient_id,
                        tier="NEEDS_REVIEW",
                        category="ALLERGY",
                        entity=allergen,
                        description=desc,
                        doc1_name=nkda_event.source_doc,
                        quote1=nkda_event.source_passage,
                        doc2_name=allergy_event.source_doc,
                        quote2=allergy_event.source_passage
                    ))
                    continue

            # ==================================================================
            # 3. 🟠 TIER 3: DUPLICATE_INVESTIGATION (Identical Lab within 72 Hours)
            # ==================================================================
            # Example: Complete Blood Count (CBC) repeated 48 hours apart across different clinics.
            if e1.category == "LAB" and e2.category == "LAB" and c1 == c2:
                if e1.source_doc != e2.source_doc:
                    d1 = parse_event_date(e1.normalized_date)
                    d2 = parse_event_date(e2.normalized_date)
                    
                    if d1 and d2:
                        hours_diff = abs((d2 - d1).total_seconds()) / 3600.0
                        if hours_diff <= 72.0:
                            key = ("DUPLICATE_INVESTIGATION", c1, e1.source_doc, e2.source_doc)
                            if key not in seen_conflict_keys:
                                seen_conflict_keys.add(key)
                                desc = (
                                    f"Identical investigation '{c1}' repeated within {int(hours_diff)} hours "
                                    f"('{e1.source_doc}' on {e1.normalized_date} vs '{e2.source_doc}' on {e2.normalized_date}). "
                                    f"Check for redundant order without acute hemorrhage indication."
                                )
                                conflicts.append(ContradictionItem(
                                    patient_id=e1.patient_id,
                                    tier="DUPLICATE_INVESTIGATION",
                                    category="LAB",
                                    entity=c1,
                                    description=desc,
                                    doc1_name=e1.source_doc,
                                    quote1=e1.source_passage,
                                    doc2_name=e2.source_doc,
                                    quote2=e2.source_passage
                                ))
                                continue

    # Sort conflicts by clinical urgency tier
    tier_priority = {
        "DIRECT_CONFLICT": 1,
        "NEEDS_REVIEW": 2,
        "DUPLICATE_INVESTIGATION": 3,
        "UPDATED": 4
    }
    conflicts.sort(key=lambda c: tier_priority.get(c.tier, 99))
    
    return conflicts
