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

    def get_public_url(self, patient_id: str, filename: str) -> str:
        """Returns the public Supabase URL or local relative route."""
        if self.supabase_url and self.bucket:
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{patient_id}/{filename}"
        return f"/uploads/{patient_id}/{filename}"

# Global singleton instance
storage_service = StorageService()
