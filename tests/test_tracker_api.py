import uuid
import pytest

pytestmark = pytest.mark.asyncio


async def _register(client) -> str:
    email = f"tracker-{uuid.uuid4().hex[:8]}@example.com"
    resp = await client.post("/api/auth/register", json={
        "email": email, "password": "pass", "displayName": "Tracker User",
    })
    return resp.json()["accessToken"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


_SAMPLE_POINTS = [
    {"latitude": 30.262, "longitude": 120.108, "timestamp": 1715000000000},
    {"latitude": 30.271, "longitude": 120.122, "timestamp": 1715000600000},
    {"latitude": 30.279, "longitude": 120.138, "timestamp": 1715001200000},
]

_SAMPLE_SESSION = {
    "startedAt": 1715000000000,
    "endedAt": 1715001200000,
    "points": _SAMPLE_POINTS,
    "photoClusters": [],
    "tags": ["机位极佳"],
}


async def test_create_session_returns_201(client):
    token = await _register(client)
    response = await client.post(
        "/api/tracker/sessions", json=_SAMPLE_SESSION, headers=_auth(token)
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["distanceM"] > 0
    assert data["durationS"] == 1200


async def test_create_session_empty_points_returns_400(client):
    token = await _register(client)
    body = {**_SAMPLE_SESSION, "points": []}
    response = await client.post(
        "/api/tracker/sessions", json=body, headers=_auth(token)
    )
    assert response.status_code == 400


async def test_create_session_without_auth_returns_401(client):
    response = await client.post("/api/tracker/sessions", json=_SAMPLE_SESSION)
    assert response.status_code == 401


async def test_list_sessions_returns_own_sessions(client):
    token = await _register(client)
    await client.post("/api/tracker/sessions", json=_SAMPLE_SESSION, headers=_auth(token))
    response = await client.get("/api/tracker/sessions", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    s = data["sessions"][0]
    for field in ("id", "startedAt", "distanceM", "durationS", "tags", "photoCount"):
        assert field in s, f"Missing field: {field}"


async def test_get_session_detail_returns_points(client):
    token = await _register(client)
    create_resp = await client.post(
        "/api/tracker/sessions", json=_SAMPLE_SESSION, headers=_auth(token)
    )
    session_id = create_resp.json()["id"]
    response = await client.get(
        f"/api/tracker/sessions/{session_id}", headers=_auth(token)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == session_id
    assert len(data["points"]) == 3


async def test_get_session_other_user_returns_403(client):
    token1 = await _register(client)
    token2 = await _register(client)
    create_resp = await client.post(
        "/api/tracker/sessions", json=_SAMPLE_SESSION, headers=_auth(token1)
    )
    session_id = create_resp.json()["id"]
    response = await client.get(
        f"/api/tracker/sessions/{session_id}", headers=_auth(token2)
    )
    assert response.status_code == 403


async def test_delete_session_returns_204_then_404(client):
    token = await _register(client)
    create_resp = await client.post(
        "/api/tracker/sessions", json=_SAMPLE_SESSION, headers=_auth(token)
    )
    session_id = create_resp.json()["id"]
    del_resp = await client.delete(
        f"/api/tracker/sessions/{session_id}", headers=_auth(token)
    )
    assert del_resp.status_code == 204
    get_resp = await client.get(
        f"/api/tracker/sessions/{session_id}", headers=_auth(token)
    )
    assert get_resp.status_code == 404
