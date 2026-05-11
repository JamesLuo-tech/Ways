import pytest

pytestmark = pytest.mark.asyncio


async def test_list_spots_returns_items(client):
    response = await client.get("/api/spots")
    assert response.status_code == 200
    data = response.json()
    assert "spots" in data
    assert "total" in data
    assert len(data["spots"]) > 0


async def test_list_spots_required_fields(client):
    response = await client.get("/api/spots")
    spot = response.json()["spots"][0]
    for field in ("id", "name", "coordinate", "category"):
        assert field in spot, f"Missing field: {field}"


async def test_list_spots_bbox_filter(client):
    response = await client.get("/api/spots?bbox=119.0,29.0,121.5,31.5")
    assert response.status_code == 200
    assert len(response.json()["spots"]) > 0


async def test_list_spots_bbox_excludes_outside(client):
    response = await client.get("/api/spots?bbox=0.0,0.0,1.0,1.0")
    assert response.status_code == 200
    assert len(response.json()["spots"]) == 0


async def test_get_spot_detail(client):
    list_resp = await client.get("/api/spots")
    spot_id = list_resp.json()["spots"][0]["id"]
    response = await client.get(f"/api/spots/{spot_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == spot_id
    assert "photos" in data
    assert "tags" in data
    assert "contents" in data


async def test_get_spot_not_found(client):
    response = await client.get("/api/spots/does-not-exist")
    assert response.status_code == 404
