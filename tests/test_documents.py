import httpx

API_URL = "http://localhost:8000"

def test_upload_protected(auth_header):
    """Test that we can upload using the automatic auth_header fixture."""
    files = {'file': ('test.pdf', b'%PDF-1.0', 'application/pdf')}
    response = httpx.post(f"{API_URL}/upload", headers=auth_header, files=files)
    
    assert response.status_code == 200
    assert "document_id" in response.json()