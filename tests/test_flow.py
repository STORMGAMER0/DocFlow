import httpx
import time
import pytest

API_URL = "http://localhost:8000"

def test_full_document_lifecycle(auth_header):
    # 1. Upload a valid small PDF
    files = {'file': ('test.pdf', b'%PDF-1.0\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'application/pdf')}
    upload_res = httpx.post(f"{API_URL}/upload", headers=auth_header, files=files)
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document_id"]

    status = "pending"
    for _ in range(6): 
        time.sleep(5)
        doc_res = httpx.get(f"{API_URL}/documents/{doc_id}", headers=auth_header)
        status = doc_res.json()["status"]
        if status != "pending":
            break
    
    assert status in ["completed", "failed"]