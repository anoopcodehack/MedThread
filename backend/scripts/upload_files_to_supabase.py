"""
Uploads all patient PDFs and lab reports from local uploads directory to Supabase Storage Bucket ('patient-records').
Organizes files by patient: {patient_id}/{filename}
"""

import os
import mimetypes
import requests
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = PROJECT_ROOT / "uploads"

SUPABASE_URL = "https://znwoerjmclnajtxhecek.supabase.co"
SUPABASE_KEY = "sb_publishable_5OTLaoxwRRuMelY4NyzNxw_ilO0MdVT"
BUCKET = "patient-records"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "x-upsert": "true"
}

def upload_all():
    print("=" * 70)
    print(" ☁️ UPLOADING ALL CLINICAL FILES TO SUPABASE STORAGE BUCKET")
    print(f" Target Bucket: {BUCKET}")
    print("=" * 70)

    # Proceed directly to upload to the verified bucket
    print(f"Targeting bucket: {BUCKET}")

    success_count = 0
    fail_count = 0

    for patient_dir in sorted(UPLOAD_DIR.iterdir()):
        if not patient_dir.is_dir() or patient_dir.name.startswith("."):
            continue
            
        pid = patient_dir.name
        print(f"\n📁 Uploading files for Patient {pid}...")

        for file_path in sorted(patient_dir.iterdir()):
            if file_path.is_dir() or file_path.name.startswith("."):
                continue

            filename = file_path.name
            object_path = f"{pid}/{filename}"
            url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"

            mime_type, _ = mimetypes.guess_type(filename)
            mime_type = mime_type or "application/octet-stream"

            headers = {**HEADERS, "Content-Type": mime_type}

            with open(file_path, "rb") as f:
                content = f.read()

            res = requests.post(url, headers=headers, data=content, timeout=10)
            if res.status_code in [200, 201]:
                print(f"  ✅ Uploaded: {object_path}", flush=True)
                success_count += 1
            else:
                print(f"  ❌ Failed {object_path} ({res.status_code}): {res.text}", flush=True)
                fail_count += 1

    print("\n" + "=" * 70, flush=True)
    print(f" 📊 UPLOAD SUMMARY: {success_count} uploaded successfully, {fail_count} failed.", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    upload_all()
