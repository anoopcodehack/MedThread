"""
Unit and Integration Test Suite for Member 3: Clinical Intelligence & Safety Logic
Tests:
1. Non-linear Medication FSM (rules_engine.py)
2. Deterministic Unit Math Normalizer (rules_engine.py)
3. 4-Tier Conflict & Duplicate Detector (reconciliation_service.py)
4. Two-Stage Epistemic Abstention Gate & Refusal Firewall (qa_service.py)
"""

import pytest
from backend.services.rules_engine import (
    VALID_TRANSITIONS,
    VALID_MEDICATION_TRANSITIONS,
    validate_fsm_transition,
    check_fsm_transition_detail,
    audit_medication_state,
    get_active_medications,
    get_stopped_medications,
    normalize_clinical_unit,
    format_dual_unit,
    normalize_date
)
from backend.services.reconciliation_service import detect_contradictions
from backend.services.qa_service import answer_clinical_question, check_refusal_firewall
from backend.schemas.evidence_schema import TimelineEventItem, QARequest


# ==============================================================================
# 1. NON-LINEAR MEDICATION FSM TESTS
# ==============================================================================
class TestMedicationFSM:
    def test_valid_transitions(self):
        # STARTED transitions
        assert validate_fsm_transition("STARTED", "DOSE_CHANGED") is True
        assert validate_fsm_transition("STARTED", "TEMPORARILY_HELD") is True
        assert validate_fsm_transition("STARTED", "DISCONTINUED") is True

        # DOSE_CHANGED transitions
        assert validate_fsm_transition("DOSE_CHANGED", "DOSE_CHANGED") is True
        assert validate_fsm_transition("DOSE_CHANGED", "TEMPORARILY_HELD") is True
        assert validate_fsm_transition("DOSE_CHANGED", "DISCONTINUED") is True

        # TEMPORARILY_HELD transitions (can resume or stop)
        assert validate_fsm_transition("TEMPORARILY_HELD", "STARTED") is True
        assert validate_fsm_transition("TEMPORARILY_HELD", "DISCONTINUED") is True

        # DISCONTINUED transitions (can be re-prescribed)
        assert validate_fsm_transition("DISCONTINUED", "STARTED") is True

    def test_invalid_transitions(self):
        # Cannot titrate a medication that is held without resuming first
        assert validate_fsm_transition("TEMPORARILY_HELD", "DOSE_CHANGED") is False
        valid, rationale = check_fsm_transition_detail("TEMPORARILY_HELD", "DOSE_CHANGED")
        assert valid is False
        assert "Cannot titrate dose while medication is temporarily held" in rationale

        # Cannot modify dose or hold a discontinued medication without new order
        assert validate_fsm_transition("DISCONTINUED", "DOSE_CHANGED") is False
        assert validate_fsm_transition("DISCONTINUED", "TEMPORARILY_HELD") is False

    def test_medication_lifecycle_stopped_not_current(self):
        """
        Rubric: A medicine stopped years ago does not look current.
        """
        events = [
            TimelineEventItem(
                patient_id=1, entity="Atorvastatin", category="MEDICATION",
                status="STARTED", raw_value="20", raw_unit="mg",
                raw_date="2020-01-01", normalized_date="2020-01-01",
                source_doc="2020_doc.pdf", page_number=1, source_passage="Start Atorvastatin 20mg"
            ),
            TimelineEventItem(
                patient_id=1, entity="Atorvastatin", category="MEDICATION",
                status="DISCONTINUED", raw_value="20", raw_unit="mg",
                raw_date="2021-06-01", normalized_date="2021-06-01",
                source_doc="2021_doc.pdf", page_number=1, source_passage="Discontinue Atorvastatin due to myalgia"
            ),
            TimelineEventItem(
                patient_id=1, entity="Metformin", category="MEDICATION",
                status="STARTED", raw_value="500", raw_unit="mg",
                raw_date="2022-01-01", normalized_date="2022-01-01",
                source_doc="2022_doc.pdf", page_number=1, source_passage="Start Metformin 500mg"
            )
        ]
        
        audit = audit_medication_state(events)
        assert audit["Atorvastatin"]["is_active"] is False
        assert audit["Atorvastatin"]["is_discontinued"] is True
        assert audit["Atorvastatin"]["current_status"] == "DISCONTINUED"
        
        assert audit["Metformin"]["is_active"] is True
        assert audit["Metformin"]["current_status"] == "STARTED"
        
        active_meds = get_active_medications(events)
        stopped_meds = get_stopped_medications(events)
        
        assert [m["entity"] for m in active_meds] == ["Metformin"]
        assert [m["entity"] for m in stopped_meds] == ["Atorvastatin"]


# ==============================================================================
# 2. DETERMINISTIC CLINICAL UNIT NORMALIZER TESTS
# ==============================================================================
class TestUnitNormalizer:
    def test_blood_glucose_mmol_to_mgdl(self):
        # 7.8 mmol/L * 18.0182 = 140.54 -> 140.5 mg/dL
        val, unit = normalize_clinical_unit("Fasting Blood Glucose", "7.8", "mmol/L")
        assert val == "140.5"
        assert unit == "mg/dL"

    def test_cholesterol_mmol_to_mgdl(self):
        # 6.2 mmol/L * 38.67 = 239.754 -> 239.8 mg/dL
        val, unit = normalize_clinical_unit("Total Cholesterol", "6.2", "mmol/L")
        assert val == "239.8"
        assert unit == "mg/dL"

    def test_creatinine_umol_to_mgdl(self):
        # 88 umol/L / 88.42 = 0.995... -> 1.0 mg/dL
        val, unit = normalize_clinical_unit("Serum Creatinine", "88", "umol/L")
        assert val == "1.0"
        assert unit == "mg/dL"

    def test_european_comma_decimal(self):
        val, unit = normalize_clinical_unit("Fasting Blood Glucose", "7,8", "mmol/L")
        assert val == "140.5"
        assert unit == "mg/dL"

    def test_dual_unit_formatting(self):
        dual = format_dual_unit("7.8", "mmol/L", "140.5", "mg/dL")
        assert dual == "140.5 mg/dL (raw: 7.8 mmol/L)"


# ==============================================================================
# 3. 4-TIER CONFLICT & DUPLICATE DETECTOR TESTS
# ==============================================================================
class TestReconciliationService:
    def test_direct_conflict_aspirin_held_vs_continue(self):
        events = [
            TimelineEventItem(
                patient_id=101, entity="Aspirin", category="MEDICATION",
                status="TEMPORARILY_HELD", raw_value="75", raw_unit="mg",
                raw_date="10/02/2024", normalized_date="2024-02-10",
                source_doc="04_Discharge_Surgery_Feb2024.pdf", page_number=1,
                source_passage="Tab. Aspirin 75mg TEMPORARILY HELD for surgery risk"
            ),
            TimelineEventItem(
                patient_id=101, entity="Aspirin", category="MEDICATION",
                status="STARTED", raw_value="75", raw_unit="mg",
                raw_date="18/02/2024", normalized_date="2024-02-18",
                source_doc="05_Consultation_Note_DrKapoor_Feb2024.pdf", page_number=1,
                source_passage="Continue Tab. Aspirin 75mg daily"
            )
        ]
        conflicts = detect_contradictions(events)
        assert len(conflicts) == 1
        assert conflicts[0].tier == "DIRECT_CONFLICT"
        assert conflicts[0].category == "MEDICATION"
        assert "Aspirin" in conflicts[0].entity

    def test_needs_review_allergy_evolution(self):
        events = [
            TimelineEventItem(
                patient_id=102, entity="NKDA (No Known Drug Allergies)", category="ALLERGY",
                status="RECORDED", raw_date="10/03/2022", normalized_date="2022-03-10",
                source_doc="01_Initial_Consult_2022.pdf", page_number=1,
                source_passage="Allergies: NKDA documented"
            ),
            TimelineEventItem(
                patient_id=102, entity="Ceftriaxone Allergy", category="ALLERGY",
                status="RECORDED", raw_date="14/01/2024", normalized_date="2024-01-14",
                source_doc="03_ER_Summary_2024.pdf", page_number=1,
                source_passage="Severe Anaphylactic Reaction to Ceftriaxone"
            )
        ]
        conflicts = detect_contradictions(events)
        assert len(conflicts) == 1
        assert conflicts[0].tier == "NEEDS_REVIEW"
        assert conflicts[0].category == "ALLERGY"
        assert "Ceftriaxone" in conflicts[0].entity

    def test_duplicate_investigation_within_72_hours(self):
        events = [
            TimelineEventItem(
                patient_id=104, entity="Complete Blood Count (CBC)", category="LAB",
                status="COMPLETED", raw_value="11200", raw_unit="/mcL",
                raw_date="10/06/2024", normalized_date="2024-06-10",
                source_doc="02_CBC_Lab_Report_Jun10_2024.pdf", page_number=1,
                source_passage="TEST: Complete Blood Count (CBC) WBC: 11,200"
            ),
            TimelineEventItem(
                patient_id=104, entity="Complete Blood Count (CBC)", category="LAB",
                status="COMPLETED", raw_value="10900", raw_unit="/mcL",
                raw_date="12/06/2024", normalized_date="2024-06-12",
                source_doc="04_CBC_Lab_Report_Jun12_2024.pdf", page_number=1,
                source_passage="TEST: Complete Blood Count (CBC) WBC: 10,900"
            )
        ]
        conflicts = detect_contradictions(events)
        assert len(conflicts) == 1
        assert conflicts[0].tier == "DUPLICATE_INVESTIGATION"
        assert conflicts[0].category == "LAB"
        assert "CBC" in conflicts[0].entity

    def test_updated_dose_titration(self):
        events = [
            TimelineEventItem(
                patient_id=101, entity="Metformin", category="MEDICATION",
                status="STARTED", raw_value="500", raw_unit="mg",
                raw_date="15/01/2022", normalized_date="2022-01-15",
                source_doc="01_Prescription_2022.pdf", page_number=1,
                source_passage="Tab. Metformin 500 mg once daily"
            ),
            TimelineEventItem(
                patient_id=101, entity="Metformin", category="MEDICATION",
                status="DOSE_CHANGED", raw_value="850", raw_unit="mg",
                raw_date="12/05/2023", normalized_date="2023-05-12",
                source_doc="03_Prescription_2023.pdf", page_number=1,
                source_passage="Tab. Metformin 850 mg twice daily"
            )
        ]
        conflicts = detect_contradictions(events)
        assert len(conflicts) == 1
        assert conflicts[0].tier == "UPDATED"
        assert conflicts[0].category == "MEDICATION"
        assert "Metformin" in conflicts[0].entity


# ==============================================================================
# 4. TWO-STAGE EPISTEMIC ABSTENTION GATE & REFUSAL FIREWALL TESTS
# ==============================================================================
class TestQAService:
    def test_refusal_firewall(self):
        # Refusal triggers
        assert check_refusal_firewall("What should I prescribe for this patient?") is True
        assert check_refusal_firewall("Diagnose my chest pain and fever") is True
        assert check_refusal_firewall("What medication should I take?") is True

        resp = answer_clinical_question(
            QARequest(patient_id=101, question="What should I prescribe for chest pain?"),
            patient_events=[]
        )
        assert resp.status == "REFUSAL_SAFETY_GUARD"
        assert "MedThread is an evidence synthesis tool, not a diagnostic device" in resp.answer
        assert len(resp.citations) == 0

    def test_hard_epistemic_abstention_gate(self):
        """
        If entity is not documented in database, NEVER call LLM. Return NOT_DOCUMENTED.
        """
        # Patient only has Metformin and Blood Glucose
        patient_events = [
            TimelineEventItem(
                patient_id=101, entity="Metformin", category="MEDICATION",
                status="STARTED", raw_value="500", raw_unit="mg",
                raw_date="15/01/2022", normalized_date="2022-01-15",
                source_doc="01_Prescription_2022.pdf", page_number=1,
                source_passage="Tab. Metformin 500 mg"
            ),
            TimelineEventItem(
                patient_id=101, entity="Fasting Blood Glucose", category="LAB",
                status="COMPLETED", raw_value="7.8", raw_unit="mmol/L",
                raw_date="04/05/2023", normalized_date="2023-05-04",
                source_doc="02_Lab_Thyrocare_2023.pdf", page_number=1,
                source_passage="Fasting Blood Glucose 7.8 mmol/L"
            )
        ]

        # 1. Ask about Penicillin Allergy (not in records)
        resp1 = answer_clinical_question(
            QARequest(patient_id=101, question="What is Rajesh Sharma's current penicillin allergy status?"),
            patient_events=patient_events
        )
        assert resp1.status == "NOT_DOCUMENTED"
        assert "not documented" in resp1.answer.lower()
        assert len(resp1.citations) == 0

        # 2. Ask about Asthma (not in records)
        resp2 = answer_clinical_question(
            QARequest(patient_id=101, question="Does David Fernandes have Asthma?"),
            patient_events=patient_events
        )
        assert resp2.status == "NOT_DOCUMENTED"
        assert len(resp2.citations) == 0

    def test_grounded_answer_with_citations(self):
        patient_events = [
            TimelineEventItem(
                patient_id=101, entity="Metformin", category="MEDICATION",
                status="STARTED", raw_value="500", raw_unit="mg",
                normalized_value="500 mg",
                raw_date="15/01/2022", normalized_date="2022-01-15",
                source_doc="01_Prescription_2022.pdf", page_number=1,
                source_passage="Tab. Metformin 500 mg once daily with meals."
            )
        ]

        resp = answer_clinical_question(
            QARequest(patient_id=101, question="What is the Metformin dose?"),
            patient_events=patient_events
        )
        assert resp.status == "GROUNDED_ANSWER"
        assert len(resp.citations) > 0
        assert resp.citations[0].source_doc == "01_Prescription_2022.pdf"
        assert resp.citations[0].page_number == 1
        assert "Metformin 500 mg" in resp.citations[0].quote

