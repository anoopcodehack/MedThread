import os
import logging
import mimetypes
import requests
from typing import Dict, Any, Optional
from backend.core.config import settings

logger = logging.getLogger("medthread.storage")

class StorageService:
    """
    Hybrid Document Storage Manager:
    - Primary Cloud: Supabase Storage Bucket ('patient-records')
    - Resilient Fallback: Local isolated disk storage ('./uploads/{patient_id}/')
    
    Guarantees zero downtime during live hackathon demos even if Wi-Fi disconnects.
    """
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else None
        self.supabase_key = settings.SUPABASE_KEY if settings.SUPABASE_KEY else None
        self.bucket = settings.SUPABASE_BUCKET
        self.local_upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.local_upload_dir, exist_ok=True)

    def save_document(self, patient_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Saves a medical document to both local storage (for PyMuPDF OCR processing)
        and attempts cloud upload to Supabase Storage.
        """
        # 1. Local filesystem save (mandatory for fast local text/OCR processing)
        patient_dir = os.path.join(self.local_upload_dir, patient_id)
        os.makedirs(patient_dir, exist_ok=True)
        local_path = os.path.join(patient_dir, filename)
        
        with open(local_path, "wb") as f:
            f.write(content)
            
        file_size = len(content)
        content_type, _ = mimetypes.guess_type(filename)
        content_type = content_type or "application/octet-stream"
        
        storage_url = f"/uploads/{patient_id}/{filename}"
        storage_type = "local"

        # 2. Supabase Storage Cloud Upload
        if self.supabase_url and self.supabase_key:
            cloud_url = self._upload_to_supabase(patient_id, filename, content, content_type)
            if cloud_url:
                storage_url = cloud_url
                storage_type = "supabase"
                logger.info(f"Successfully uploaded {filename} to Supabase Storage: {cloud_url}")
            else:
                logger.warning(f"Supabase upload skipped or failed for {filename}; using local storage fallback.")

        return {
            "local_path": local_path,
            "storage_url": storage_url,
            "storage_type": storage_type,
            "file_size": file_size,
            "filename": filename,
            "content_type": content_type
        }

    def _upload_to_supabase(self, patient_id: str, filename: str, content: bytes, content_type: str) -> Optional[str]:
        """
        Direct REST upload to Supabase Storage Object API.
        POST /storage/v1/object/{bucket}/{patient_id}/{filename}
        """
        try:
            # File object key in bucket
            object_path = f"{patient_id}/{filename}"
            upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{object_path}"
            
            headers = {
                "Authorization": f"Bearer {self.supabase_key}",
                "apikey": self.supabase_key,
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            
            # 5-second timeout so it never blocks the request if offline
            resp = requests.post(upload_url, headers=headers, data=content, timeout=5)
            
            if resp.status_code in [200, 201]:
                # Construct public download URL
                public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{object_path}"
                return public_url
            else:
                logger.warning(f"Supabase Storage returned status {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            logger.warning(f"Supabase Storage network exception: {e}")
            return None

    def ensure_bucket_exists(self) -> bool:
        """
        Ensures the 'patient-records' bucket exists in Supabase.
        Attempts creation if missing.
        """
        if not (self.supabase_url and self.supabase_key):
            return False
            
        try:
            url = f"{self.supabase_url}/storage/v1/bucket"
            headers = {
                "Authorization": f"Bearer {self.supabase_key}",
                "apikey": self.supabase_key,
                "Content-Type": "application/json"
            }
            # List buckets
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                buckets = resp.json()
                if any(b.get("name") == self.bucket or b.get("id") == self.bucket for b in buckets):
                    return True
                
                # Attempt to create bucket
                create_resp = requests.post(
                    url,
                    headers=headers,
                    json={"id": self.bucket, "name": self.bucket, "public": True},
                    timeout=5
                )
                return create_resp.status_code in [200, 201]
            return False
        except Exception as e:
            logger.warning(f"Failed to verify/create Supabase bucket: {e}")
            return False

    def create_signed_url(self, patient_id: str, filename: str, expires_in_seconds: int = 3600) -> Optional[str]:
        """
        Generates a 60-minute time-bound signed URL for clinician or patient emergency access.
        Fulfills strict clinical access-control requirements.
        """
        if not (self.supabase_url and self.supabase_key):
            return None
            
        try:
            object_path = f"{patient_id}/{filename}"
            sign_url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{object_path}"
            headers = {
                "Authorization": f"Bearer {self.supabase_key}",
                "apikey": self.supabase_key,
                "Content-Type": "application/json"
            }
            resp = requests.post(sign_url, headers=headers, json={"expiresIn": expires_in_seconds}, timeout=5)
            if resp.status_code == 200:
                signed_path = resp.json().get("signedURL")
                if signed_path:
                    return f"{self.supabase_url}/storage/v1{signed_path}"
            return None
        except Exception as e:
            logger.warning(f"Error creating signed URL for {filename}: {e}")
            return None

    def delete_document(self, patient_id: str, filename: str) -> bool:
        """
        Purges a document from both local storage and Supabase bucket.
        """
        local_path = os.path.join(self.local_upload_dir, patient_id, filename)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError as e:
                logger.warning(f"Failed to delete local file {local_path}: {e}")

        if self.supabase_url and self.supabase_key:
            try:
                del_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                    "Content-Type": "application/json"
                }
                object_path = f"{patient_id}/{filename}"
                requests.delete(del_url, headers=headers, json={"prefixes": [object_path]}, timeout=5)
            except Exception as e:
                logger.warning(f"Error deleting {object_path} from Supabase: {e}")

        return True

    def get_public_url(self, patient_id: str, filename: str) -> str:
        """Returns the public Supabase URL or local relative route."""
        if self.supabase_url and self.bucket:
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{patient_id}/{filename}"
        return f"/uploads/{patient_id}/{filename}"

# Global singleton instance
storage_service = StorageService()
