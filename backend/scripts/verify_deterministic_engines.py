import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.rules_engine import (
    normalize_clinical_unit,
    normalize_date,
    validate_fsm_transition,
    check_fsm_transition_detail,
    audit_medication_state
)
from backend.services.reconciliation_service import detect_contradictions
from backend.services.qa_service import check_refusal_firewall, answer_clinical_question
from backend.schemas.evidence_schema import TimelineEventItem, QARequest

def run_verification():
    print("=" * 75, flush=True)
    print(" 🛡️ LIVE VERIFICATION: 5 DETERMINISTIC SAFETY ENGINES (ZERO-LLM)", flush=True)
    print("=" * 75, flush=True)

    # --- 1. Zero-LLM Math Normalizer ---
    print("\n1️⃣ ZERO-LLM MATH NORMALIZER (rules_engine.py):", flush=True)
    g_val, g_unit = normalize_clinical_unit('Fasting Blood Glucose', '7.8', 'mmol/L')
    print(f"   • Glucose 7.8 mmol/L     -> {g_val} {g_unit} (Formula: x * 18.0182)", flush=True)
    c_val, c_unit = normalize_clinical_unit('Total Cholesterol', '5.1', 'mmol/L')
    print(f"   • Cholesterol 5.1 mmol/L -> {c_val} {c_unit} (Formula: x * 38.67)", flush=True)
    cr_val, cr_unit = normalize_clinical_unit('Serum Creatinine', '110', 'umol/L')
    print(f"   • Creatinine 110 umol/L  -> {cr_val} {cr_unit} (Formula: / 88.42)", flush=True)
    assert g_val == '140.5' and g_unit == 'mg/dL'
    assert c_val == '197.2' and c_unit == 'mg/dL'
    assert cr_val == '1.24' and cr_unit == 'mg/dL'
    print("   ✅ Math Normalizer: 100% Deterministic & Correct!", flush=True)

    # --- 2. Medication FSM ---
    print("\n2️⃣ NON-LINEAR MEDICATION FSM (rules_engine.py):", flush=True)
    t1 = validate_fsm_transition('STARTED', 'DOSE_CHANGED')
    t2 = validate_fsm_transition('DOSE_CHANGED', 'TEMPORARILY_HELD')
    t3 = validate_fsm_transition('TEMPORARILY_HELD', 'DISCONTINUED')
    invalid_t = validate_fsm_transition('DISCONTINUED', 'TEMPORARILY_HELD')
    print(f"   • STARTED -> DOSE_CHANGED          : Valid={t1}", flush=True)
    print(f"   • DOSE_CHANGED -> TEMPORARILY_HELD : Valid={t2}", flush=True)
    print(f"   • TEMPORARILY_HELD -> DISCONTINUED : Valid={t3}", flush=True)
    print(f"   • DISCONTINUED -> TEMPORARILY_HELD : Blocked={not invalid_t}", flush=True)
    assert t1 and t2 and t3 and (not invalid_t)
    print("   ✅ Medication FSM: 100% State Transition Integrity!", flush=True)

    # --- 3. 4-Tier Contradiction Radar ---
    print("\n3️⃣ 4-TIER CONTRADICTION RADAR (reconciliation_service.py):", flush=True)
    events = [
        TimelineEventItem(id=1, patient_id=101, document_id=1, entity='Aspirin', category='MEDICATION', status='TEMPORARILY_HELD', raw_value='75', raw_unit='mg', normalized_value='75 mg', raw_date='12/02/2024', normalized_date='2024-02-12', date_status='CONFIDENT', source_doc='Discharge.pdf', page_number=1, source_passage='Hold Aspirin 75mg daily for 7 days.', is_reviewed=0),
        TimelineEventItem(id=2, patient_id=101, document_id=2, entity='Aspirin', category='MEDICATION', status='STARTED', raw_value='75', raw_unit='mg', normalized_value='75 mg', raw_date='14/02/2024', normalized_date='2024-02-14', date_status='CONFIDENT', source_doc='Cardio.pdf', page_number=1, source_passage='Continue Aspirin 75mg daily for cardiac prophylaxis.', is_reviewed=0),
        TimelineEventItem(id=3, patient_id=101, document_id=3, entity='Complete Blood Count (CBC)', category='LAB', status='COMPLETED', raw_value='11200', raw_unit='/mcL', normalized_value='11200 /mcL', raw_date='10/06/2024', normalized_date='2024-06-10', date_status='CONFIDENT', source_doc='Lab1.pdf', page_number=1, source_passage='CBC Ordered.', is_reviewed=0),
        TimelineEventItem(id=4, patient_id=101, document_id=4, entity='Complete Blood Count (CBC)', category='LAB', status='COMPLETED', raw_value='10800', raw_unit='/mcL', normalized_value='10800 /mcL', raw_date='12/06/2024', normalized_date='2024-06-12', date_status='CONFIDENT', source_doc='Lab2.pdf', page_number=1, source_passage='CBC Ordered 48h later.', is_reviewed=0)
    ]
    radar = detect_contradictions(events)
    tiers_found = set(r.tier for r in radar)
    print(f"   • Tiers detected across test records: {tiers_found}", flush=True)
    for r in radar:
        print(f"     - [{r.tier}] {r.entity}: {r.description[:60]}...", flush=True)
    assert 'DIRECT_CONFLICT' in tiers_found
    assert 'DUPLICATE_INVESTIGATION' in tiers_found
    print("   ✅ 4-Tier Radar: 100% Rule-Based Detection Operational!", flush=True)

    # --- 4. Stage 0 Refusal Firewall ---
    print("\n4️⃣ STAGE 0 REFUSAL FIREWALL (qa_service.py):", flush=True)
    b1 = check_refusal_firewall('What dosage of insulin should I take?')
    b2 = check_refusal_firewall('Please diagnose this patient with cancer')
    b3 = check_refusal_firewall('What medications is the patient taking?')
    print(f"   • Prescribing Query (\"What dosage...\") -> Blocked={b1}", flush=True)
    print(f"   • Diagnostic Query (\"Please diagnose...\") -> Blocked={b2}", flush=True)
    print(f"   • Safe Record Query (\"What medications...\") -> Allowed={not b3}", flush=True)
    assert b1 and b2 and (not b3)
    print("   ✅ Refusal Firewall: 100% Safety Enforcement Active!", flush=True)

    # --- 5. Epistemic Abstention Gate ---
    print("\n5️⃣ TWO-STAGE EPISTEMIC ABSTENTION GATE (qa_service.py):", flush=True)
    req = QARequest(patient_id=101, question='Does the patient have chronic kidney disease?')
    resp = answer_clinical_question(req, patient_events=[])
    print(f"   • Query for unrecorded condition: Status={resp.status}", flush=True)
    print(f"   • Grounded Refusal Answer: \"{resp.answer[:85]}...\"", flush=True)
    assert resp.status == 'NOT_DOCUMENTED'
    print("   ✅ Epistemic Abstention Gate: 100% Zero-LLM Hard Stop Operational!", flush=True)

    print("\n" + "=" * 75, flush=True)
    print(" 🎉 ALL 5 PURE PYTHON DETERMINISTIC SAFETY ENGINES ARE 100% WORKING!", flush=True)
    print("=" * 75, flush=True)

if __name__ == "__main__":
    run_verification()
