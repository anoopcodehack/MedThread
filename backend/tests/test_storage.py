"""
Unit Tests for Storage Service (Supabase Cloud + Local Sandbox Resilient Mode)
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.storage_service import storage_service

def test_storage_save_and_fallback():
    patient_id = "test_patient_777"
    filename = "test_lab_report.pdf"
    content = b"%PDF-1.4 Fake Medical Document Content for Testing"
    
    # Save document
    res = storage_service.save_document(patient_id, filename, content)
    
    assert res is not None
    assert res["filename"] == filename
    assert res["file_size"] == len(content)
    assert os.path.exists(res["local_path"])
    
    # Verify content saved on disk
    with open(res["local_path"], "rb") as f:
        saved_bytes = f.read()
    assert saved_bytes == content
    
    # Test public URL resolution
    url = storage_service.get_public_url(patient_id, filename)
    assert "test_lab_report.pdf" in url
    
    # Cleanup
    storage_service.delete_document(patient_id, filename)
    assert not os.path.exists(res["local_path"])

def run_storage_tests():
    print("=" * 60)
    print(" ☁️ EXECUTING STORAGE SERVICE UNIT TESTS")
    print("=" * 60)
    test_storage_save_and_fallback()
    print(" [1/1] ✅ Hybrid Storage Save, URL Resolution & Cleanup Passed")
    print("=" * 60)
    print(" 🎉 STORAGE UNIT TESTS PASSED (100%)")
    print("=" * 60)

if __name__ == "__main__":
    run_storage_tests()
