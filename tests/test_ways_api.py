import pytest

pytestmark = pytest.mark.asyncio


async def test_list_ways_returns_items(client):
    response = await client.get("/api/ways")
    assert response.status_code == 200
    data = response.json()
    assert "ways" in data
    assert "total" in data
    assert len(data["ways"]) > 0


async def test_list_ways_required_fields(client):
    response = await client.get("/api/ways")
    way = response.json()["ways"][0]
    for field in ("id", "name", "theme", "heatBucket", "previewPolyline",
                  "contentCount", "savedCountLabel", "spotCount", "distance", "duration", "coverPhoto"):
        assert field in way, f"Missing field: {field}"


async def test_list_ways_bbox_filter(client):
    # Bounding box covering Hangzhou + Moganshan area
    response = await client.get("/api/ways?bbox=119.0,29.0,121.5,31.5")
    assert response.status_code == 200
    assert len(response.json()["ways"]) > 0


async def test_list_ways_bbox_excludes_outside(client):
    # Bounding box in the middle of the ocean — no ways there
    response = await client.get("/api/ways?bbox=0.0,0.0,1.0,1.0")
    assert response.status_code == 200
    assert len(response.json()["ways"]) == 0


async def test_get_way_detail(client):
    list_resp = await client.get("/api/ways")
    way_id = list_resp.json()["ways"][0]["id"]
    response = await client.get(f"/api/ways/{way_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == way_id
    assert "spots" in data


async def test_get_way_not_found(client):
    response = await client.get("/api/ways/does-not-exist")
    assert response.status_code == 404
