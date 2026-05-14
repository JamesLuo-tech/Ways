import uuid
import pytest

pytestmark = pytest.mark.asyncio


async def _register(client) -> str:
    email = f"content-{uuid.uuid4().hex[:8]}@example.com"
    resp = await client.post("/api/auth/register", json={
        "email": email, "password": "pass", "displayName": "Content User",
    })
    return resp.json()["accessToken"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


_WAY_BODY = {
    "name": "测试路线",
    "theme": "hiking",
    "previewPolyline": [[120.108, 30.262], [120.122, 30.271], [120.138, 30.279]],
    "coverPhoto": "https://example.com/photo.jpg",
    "heatBucket": "emerging",
}

_SPOT_BODY = {
    "name": "测试地点",
    "category": "scenic",
    "coordinate": [120.108, 30.262],
    "tags": ["机位极佳"],
}


async def test_create_way_returns_201(client):
    token = await _register(client)
    response = await client.post("/api/ways", json=_WAY_BODY, headers=_auth(token))
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "测试路线"
    assert data["theme"] == "hiking"
    assert "id" in data
    assert "spots" in data


async def test_create_way_without_auth_returns_401(client):
    response = await client.post("/api/ways", json=_WAY_BODY)
    assert response.status_code == 401


async def test_patch_way_updates_fields(client):
    token = await _register(client)
    create_resp = await client.post("/api/ways", json=_WAY_BODY, headers=_auth(token))
    way_id = create_resp.json()["id"]
    response = await client.patch(
        f"/api/ways/{way_id}",
        json={"name": "更新后路线", "heatBucket": "hot"},
        headers=_auth(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "更新后路线"
    assert data["heatBucket"] == "hot"


async def test_patch_other_user_way_returns_403(client):
    token1 = await _register(client)
    token2 = await _register(client)
    create_resp = await client.post("/api/ways", json=_WAY_BODY, headers=_auth(token1))
    way_id = create_resp.json()["id"]
    response = await client.patch(
        f"/api/ways/{way_id}", json={"name": "hack"}, headers=_auth(token2)
    )
    assert response.status_code == 403


async def test_patch_seed_way_returns_403(client):
    list_resp = await client.get("/api/ways")
    seed_way_id = list_resp.json()["ways"][0]["id"]
    token = await _register(client)
    response = await client.patch(
        f"/api/ways/{seed_way_id}", json={"name": "hack"}, headers=_auth(token)
    )
    assert response.status_code == 403


async def test_delete_way_returns_204_then_404(client):
    token = await _register(client)
    create_resp = await client.post("/api/ways", json=_WAY_BODY, headers=_auth(token))
    way_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/ways/{way_id}", headers=_auth(token))
    assert del_resp.status_code == 204
    get_resp = await client.get(f"/api/ways/{way_id}")
    assert get_resp.status_code == 404


async def test_create_spot_returns_201(client):
    token = await _register(client)
    response = await client.post("/api/spots", json=_SPOT_BODY, headers=_auth(token))
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "测试地点"
    assert data["category"] == "scenic"
    assert "id" in data


async def test_patch_spot_updates_fields(client):
    token = await _register(client)
    create_resp = await client.post("/api/spots", json=_SPOT_BODY, headers=_auth(token))
    spot_id = create_resp.json()["id"]
    response = await client.patch(
        f"/api/spots/{spot_id}",
        json={"name": "更新地点", "tags": ["逆光友好"]},
        headers=_auth(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "更新地点"
    assert "逆光友好" in data["tags"]


async def test_delete_spot_returns_204(client):
    token = await _register(client)
    create_resp = await client.post("/api/spots", json=_SPOT_BODY, headers=_auth(token))
    spot_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/spots/{spot_id}", headers=_auth(token))
    assert del_resp.status_code == 204


async def test_delete_other_user_spot_returns_403(client):
    token1 = await _register(client)
    token2 = await _register(client)
    create_resp = await client.post("/api/spots", json=_SPOT_BODY, headers=_auth(token1))
    spot_id = create_resp.json()["id"]
    response = await client.delete(
        f"/api/spots/{spot_id}", headers=_auth(token2)
    )
    assert response.status_code == 403
