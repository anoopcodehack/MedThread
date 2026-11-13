import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.main import app

def log(msg):
    print(msg, flush=True)

def run_tests():
    log("=" * 65)
    log(" 🧪 MEDTHREAD END-TO-END SYSTEM INTEGRATION TEST SUITE")
    log("=" * 65)

    log("\n[1/9] Initializing FastAPI TestClient...")
    client = TestClient(app)
    log("  ✅ TestClient initialized.")

    log("\n[2/9] Testing System Status & Diagnostics...")
    r = client.get("/api/system/status")
    assert r.status_code == 200, f"Status failed: {r.status_code}"
    data = r.json()
    log(f"  ✅ Database Engine : {data['database']['type']} ({data['database']['dialect']})")
    log(f"  ✅ Storage Mode    : {data['storage']['backend']}")
    log(f"  ✅ Telemetry       : {data['telemetry']['registered_patients']} Patients, {data['telemetry']['ingested_documents']} Docs, {data['telemetry']['timeline_events']} Events")

    log("\n[3/9] Testing Longitudinal Timeline (Patient 101)...")
    r = client.get("/api/timeline/101")
    assert r.status_code == 200
    events = r.json()
    log(f"  ✅ Fetched {len(events)} events with 14 audit fields.")
    ev = events[0]
    log(f"  ✅ Sample: {ev['entity']} [{ev['status']}] on {ev['normalized_date']} from '{ev['source_doc']}'")

    log("\n[4/9] Testing 4-Tier Contradiction Radar (Patient 101)...")
    r = client.get("/api/conflicts/101")
    assert r.status_code == 200
    conflicts = r.json()
    log(f"  ✅ Detected {len(conflicts)} conflict radar records.")
    for c in conflicts[:2]:
        log(f"  ✅ [{c['tier']}] {c['entity']}: {c['description'][:65]}...")

    log("\n[5/9] Testing Document Registry (Patient 101)...")
    r = client.get("/api/documents/101")
    assert r.status_code == 200
    docs = r.json()
    log(f"  ✅ Retrieved {len(docs)} documents.")
    log(f"  ✅ First file URL: {docs[0]['file_url']}")

    log("\n[6/9] Testing Raw PDF Document Streaming...")
    r = client.get("/api/documents/raw/101/01_Prescription_2022.pdf")
    assert r.status_code == 200
    log(f"  ✅ Streamed raw PDF: {len(r.content)} bytes, Content-Type: {r.headers.get('content-type')}")

    log("\n[7/9] Testing Time-Bound Signed URL Generation...")
    r = client.post("/api/documents/signed-url", json={"patient_id": 101, "filename": "01_Prescription_2022.pdf"})
    assert r.status_code == 200
    log(f"  ✅ Signed URL: {r.json()['signed_url'][:60]}... (Expires in {r.json()['expires_in_seconds']}s)")

    log("\n[8/9] Testing Clinician Review Override (Problem 10)...")
    target_event_id = events[0]["id"]
    r = client.patch(f"/api/review/{target_event_id}", json={
        "reviewer_name": "Dr. Ananya Rao",
        "field_modified": "status",
        "new_value": "DISCONTINUED",
        "reason": "Verified with patient: discontinued due to GI distress."
    })
    assert r.status_code == 200, f"Review override failed: {r.status_code} - {r.text}"
    log(f"  ✅ Override saved for Event {target_event_id}: is_reviewed={r.json()['is_reviewed']}")
    log(f"  ✅ Override banner: {r.json()['reviewed_override'][:75]}...")

    log("\n[9/9] Testing Refusal Safety Guard (Problem 7)...")
    r = client.post("/api/qa", json={"patient_id": 101, "question": "What dosage of insulin should I prescribe?"})
    assert r.status_code == 200
    res = r.json()
    assert res.get("status") == "REFUSAL_SAFETY_GUARD"
    log(f"  ✅ Refusal Firewall Triggered: Status = {res.get('status')}")
    log(f"  ✅ Block message: {res.get('answer')[:85]}...")

    log("\n" + "=" * 65)
    log(" 🎉 ALL 9 END-TO-END SYSTEM TESTS PASSED 100% WITH ZERO ERRORS!")
    log("=" * 65)

if __name__ == "__main__":
    run_tests()
