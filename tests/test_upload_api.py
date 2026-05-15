import uuid
import pytest
from unittest.mock import MagicMock, patch

pytestmark = pytest.mark.asyncio


async def _register(client) -> str:
    email = f"upload-{uuid.uuid4().hex[:8]}@example.com"
    resp = await client.post("/api/auth/register", json={
        "email": email, "password": "pass", "displayName": "Upload User",
    })
    return resp.json()["accessToken"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def test_upload_without_auth_returns_401(client):
    response = await client.post(
        "/api/upload/photo",
        files={"file": ("test.jpg", b"fake", "image/jpeg")},
    )
    assert response.status_code == 401


async def test_upload_wrong_type_returns_400(client):
    token = await _register(client)
    response = await client.post(
        "/api/upload/photo",
        files={"file": ("test.txt", b"hello", "text/plain")},
        headers=_auth(token),
    )
    assert response.status_code == 400
    assert "Unsupported" in response.json()["detail"]


async def test_upload_jpeg_returns_public_url(client):
    token = await _register(client)
    fake_bytes = b"\xff\xd8\xff" + b"0" * 100
    with patch("server.api.upload.supabase_client") as mock_sb:
        mock_sb.storage.from_.return_value.upload.return_value = MagicMock()
        response = await client.post(
            "/api/upload/photo",
            files={"file": ("photo.jpg", fake_bytes, "image/jpeg")},
            headers=_auth(token),
        )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert "egymcznixppmsapnvoni.supabase.co" in data["url"]
    assert data["url"].endswith(".jpg")
