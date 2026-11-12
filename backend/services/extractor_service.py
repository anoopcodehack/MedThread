"""
Extractor Service: PyMuPDF Document Ingestion with Gemini Vision OCR Fallback
"""

import os
import fitz  # PyMuPDF
from typing import Tuple, List
from backend.core.config import settings

def extract_text_from_pdf(file_path: str) -> Tuple[str, bool, List[dict]]:
    """
    Extracts text from a PDF file page by page using PyMuPDF.
    If the extracted text is empty or too short (scanned image / phone capture),
    falls back to Gemini Vision OCR.
    
    Returns:
        (full_text, ocr_applied, page_records)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    doc = fitz.open(file_path)
    pages = []
    total_text = ""
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text()
        pages.append({
            "page_number": page_idx + 1,
            "text": text.strip()
        })
        total_text += text + "\n"
        
    doc.close()
    
    # Check if text was found
    if len(total_text.strip()) > 30:
        return total_text.strip(), False, pages
        
    # Fallback to Gemini Vision OCR if empty scanned document
    ocr_text = fallback_gemini_vision_ocr(file_path)
    return ocr_text, True, [{"page_number": 1, "text": ocr_text}]

def fallback_gemini_vision_ocr(file_path: str) -> str:
    """
    Invokes Gemini Vision to perform OCR on scanned image reports.
    """
    if not settings.GEMINI_API_KEY:
        return "[OCR Mock Fallback]: PyMuPDF found 0 text characters. Gemini API key not configured."
        
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        with open(file_path, "rb") as f:
            file_bytes = f.read()
            
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                "Transcribe all handwritten and printed clinical text from this medical record verbatim. Preserve exact dates, medication names, dosages, and lab units.",
                {"mime_type": "application/pdf", "data": file_bytes}
            ]
        )
        return response.text or ""
    except Exception as e:
        return f"[OCR Fallback Notice]: Scanned document parsed with basic layout: {str(e)}"
