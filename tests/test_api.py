import pytest
import httpx

API_URL = "http://localhost:8000"

def test_health_check():
    response = httpx.get(f"{API_URL}/")
    assert response.status_code == 200
    assert response.json()["status"] == "DocFlow API is Online"

def test_user_registration():
    payload = {"username": "testuser_pytest", "password": "password123"}
    response = httpx.post(f"{API_URL}/register", json=payload)
    # 200 if new, 400 if already exists
    assert response.status_code in [200, 400]