import uuid
import pytest

pytestmark = pytest.mark.asyncio


def _email() -> str:
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


async def test_register_returns_token(client):
    response = await client.post("/api/auth/register", json={
        "email": _email(),
        "password": "password123",
        "displayName": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"


async def test_register_duplicate_email_returns_400(client):
    email = _email()
    payload = {"email": email, "password": "pass", "displayName": "Dup"}
    await client.post("/api/auth/register", json=payload)
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 400


async def test_login_correct_credentials_returns_token(client):
    email = _email()
    await client.post("/api/auth/register", json={
        "email": email, "password": "secret", "displayName": "Login User",
    })
    response = await client.post("/api/auth/login", json={
        "email": email, "password": "secret",
    })
    assert response.status_code == 200
    assert "accessToken" in response.json()


async def test_login_wrong_password_returns_401(client):
    email = _email()
    await client.post("/api/auth/register", json={
        "email": email, "password": "correct", "displayName": "Wrong",
    })
    response = await client.post("/api/auth/login", json={
        "email": email, "password": "incorrect",
    })
    assert response.status_code == 401


async def test_me_with_valid_token_returns_user(client):
    email = _email()
    reg = await client.post("/api/auth/register", json={
        "email": email, "password": "pass", "displayName": "Me User",
    })
    token = reg.json()["accessToken"]
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["displayName"] == "Me User"


async def test_me_without_token_returns_401(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
