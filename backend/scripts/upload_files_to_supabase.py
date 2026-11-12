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

    # Check if bucket exists
    r = requests.get(f"{SUPABASE_URL}/storage/v1/bucket", headers=HEADERS)
    buckets = [b.get("id") or b.get("name") for b in r.json()] if r.status_code == 200 else []
    print(f"Found Buckets in Supabase: {buckets}")

    if BUCKET not in buckets:
        print(f"\n⚠️ BUCKET '{BUCKET}' NOT FOUND IN SUPABASE!")
        print("💡 QUICK 10-SECOND FIX IN SUPABASE DASHBOARD:")
        print("   1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/znwoerjmclnajtxhecek")
        print("   2. Click 'Storage' on the left sidebar")
        print("   3. Click 'New bucket'")
        print("   4. Set Name to: patient-records")
        print("   5. Turn 'Public bucket' toggle to ON")
        print("   6. Click 'Save'")
        print("   Then run this script again!\n")
        return

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

            res = requests.post(url, headers=headers, data=content)
            if res.status_code in [200, 201]:
                print(f"  ✅ Uploaded: {object_path}")
                success_count += 1
            else:
                print(f"  ❌ Failed {object_path} ({res.status_code}): {res.text}")
                fail_count += 1

    print("\n" + "=" * 70)
    print(f" 📊 UPLOAD SUMMARY: {success_count} uploaded successfully, {fail_count} failed.")
    print("=" * 70)

if __name__ == "__main__":
    upload_all()
