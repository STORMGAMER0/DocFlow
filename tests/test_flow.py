import httpx
import time
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

API_URL = "http://localhost:8000"

def create_test_pdf():
    """Generate a valid PDF with properly extractable text"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    story = [
        Paragraph("This is a test PDF content with the word APPLE", styles['Normal']),
        Paragraph("This ensures the text is properly embedded and extractable.", styles['Normal'])
    ]
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def test_full_document_lifecycle(auth_header):
    # 1. Upload Document with REAL PDF
    pdf_content = create_test_pdf()
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}
    upload_res = httpx.post(f"{API_URL}/upload", headers=auth_header, files=files)
    
    if upload_res.status_code != 200:
        print(f"\nUpload failed with status {upload_res.status_code}")
        print(f"Response Body: {upload_res.text}")
    
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document_id"]
    print(f"\n[1] Uploaded doc_id: {doc_id}")

    # 2. Poll for Completion (Max 15 seconds)
    status = "pending"
    data = {}
    for i in range(15):
        status_res = httpx.get(f"{API_URL}/documents/{doc_id}", headers=auth_header)
        data = status_res.json()
        status = data.get("status")
        print(f"Polling attempt {i+1}: status={status}")  # Debug output
        if status in ["completed", "failed"]:
            break
        time.sleep(1)
    
    assert status == "completed", f"Expected 'completed' but got '{status}'"
    print(f"[2] Processing status: {status}")

    # 3. Verify Content Extraction
    content = data.get("content", "")
    print(f"[3] Extracted content: '{content}'")  # Debug output
    print(f"[3] Content length: {len(content)} characters")
    
    assert "APPLE" in content, f"Expected 'APPLE' in content but got: {content}"
    print(f"[3] Verified content extraction")

    # 4. Delete Document (Cleanup)
    delete_res = httpx.delete(f"{API_URL}/documents/{doc_id}", headers=auth_header)
    assert delete_res.status_code == 204
    print(f"[4] Deleted doc_id: {doc_id}")

    # 5. Verify it's gone
    final_check = httpx.get(f"{API_URL}/documents/{doc_id}", headers=auth_header)
    assert final_check.status_code == 404
    print("[5] Final 404 verification passed")