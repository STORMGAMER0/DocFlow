import pytest
import httpx

API_URL = "http://localhost:8000"

@pytest.fixture(scope="session")
def auth_token():
    """Fixture to register a test user and return a JWT token."""
    client = httpx.Client(base_url=API_URL)
    username = "pytest_user"
    password = "password123"
    
    # 1. Register (ignore if already exists)
    client.post("/register", json={"username": username, "password": password})
    
    # 2. Login to get token
    response = client.post("/token", data={
        "username": username,
        "password": password,
        "grant_type": "password"
    })
    
    token = response.json()["access_token"]
    return token

@pytest.fixture
def auth_header(auth_token):
    """Provides the Authorization header for protected routes."""
    return {"Authorization": f"Bearer {auth_token}"}