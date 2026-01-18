import httpx
import pytest

API_URL = "http://localhost:8000"

def test_api_is_online():
    """Verify the API container is reachable."""
    response = httpx.get(f"{API_URL}/")
    assert response.status_code == 200

def test_database_connection(auth_token):
    """Verify the API can write to Postgres by checking the register logic."""
    assert auth_token is not None