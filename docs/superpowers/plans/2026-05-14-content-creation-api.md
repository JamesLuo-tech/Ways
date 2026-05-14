# Content Creation API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add POST/PATCH/DELETE endpoints to /api/ways and /api/spots so authenticated users can create and manage their own content.

**Architecture:** Add `owner_id VARCHAR NULL` to ways and spots via migration 004. POST creates resource with owner=current_user. PATCH does partial updates (None fields skipped). DELETE is owner-only. Seed data (owner_id=null) is read-protected with 403. After commit with geometry columns, always call `db.refresh()` to reload WKBElement from DB before calling `to_shape()`.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, GeoAlchemy2, PostGIS, pytest-asyncio

---

## File Map

**Create:**
- `server/schemas/content.py` — CreateWayRequest, PatchWayRequest, CreateSpotRequest, PatchSpotRequest
- `server/alembic/versions/004_add_owner_id.py` — adds owner_id to ways and spots
- `tests/test_content_api.py` — 10 tests

**Modify:**
- `server/db/models.py` — add owner_id to Way and Spot
- `server/api/routes.py` — add POST, PATCH, DELETE for ways (keep existing GETs)
- `server/api/spots.py` — add POST, PATCH, DELETE for spots (keep existing GETs)

---

## Task 1: Add owner_id to models and run migration

**Files:**
- Modify: `server/db/models.py`
- Create: `server/alembic/versions/004_add_owner_id.py`

- [ ] **Step 1: Add `owner_id` to Way and Spot in `server/db/models.py`**

In the `Way` class, add after `saved_count_label`:
```python
    owner_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
```

In the `Spot` class, add after `related_ways`:
```python
    owner_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
```

Do NOT modify User or TrackSession.

- [ ] **Step 2: Verify**

```bash
python -c "from server.db.models import Way, Spot; print(Way.owner_id, Spot.owner_id)"
```

Expected: two SQLAlchemy column descriptors printed, no error.

- [ ] **Step 3: Create `server/alembic/versions/004_add_owner_id.py`**

```python
"""add owner_id to ways and spots

Revision ID: 004
Revises: 003
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ways", sa.Column("owner_id", sa.String(), nullable=True))
    op.add_column("spots", sa.Column("owner_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("ways", "owner_id")
    op.drop_column("spots", "owner_id")
```

- [ ] **Step 4: Run migration**

```bash
alembic upgrade head
```

Expected:
```
INFO  [alembic.runtime.migration] Running upgrade 003 -> 004, add owner_id to ways and spots
```

---

## Task 2: Create content request schemas

**Files:**
- Create: `server/schemas/content.py`

- [ ] **Step 1: Create `server/schemas/content.py`**

```python
from pydantic import BaseModel


class CreateWayRequest(BaseModel):
    name: str
    theme: str
    previewPolyline: list[tuple[float, float]]
    coverPhoto: str = ""
    heatBucket: str = "emerging"
    spotCount: int = 0
    distance: int = 0
    duration: int = 0
    contentCount: int = 0
    savedCountLabel: str = "0"
    spots: list[dict] = []


class PatchWayRequest(BaseModel):
    name: str | None = None
    theme: str | None = None
    previewPolyline: list[tuple[float, float]] | None = None
    coverPhoto: str | None = None
    heatBucket: str | None = None
    spotCount: int | None = None
    distance: int | None = None
    duration: int | None = None
    contentCount: int | None = None
    savedCountLabel: str | None = None
    spots: list[dict] | None = None


class CreateSpotRequest(BaseModel):
    name: str
    category: str
    coordinate: tuple[float, float]
    region: dict | None = None
    tags: list[str] = []
    photos: list[dict] = []
    wayIds: list[str] = []
    contents: list[dict] = []
    relatedWays: list[dict] = []


class PatchSpotRequest(BaseModel):
    name: str | None = None
    category: str | None = None
    coordinate: tuple[float, float] | None = None
    region: dict | None = None
    tags: list[str] | None = None
    photos: list[dict] | None = None
    wayIds: list[str] | None = None
    contents: list[dict] | None = None
    relatedWays: list[dict] | None = None
```

- [ ] **Step 2: Verify**

```bash
python -c "from server.schemas.content import CreateWayRequest, PatchSpotRequest; print('OK')"
```

Expected: `OK`

---

## Task 3: Write failing tests

**Files:**
- Create: `tests/test_content_api.py`

- [ ] **Step 1: Create `tests/test_content_api.py`**

```python
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
```

- [ ] **Step 2: Run — expect all 10 to FAIL**

```bash
pytest tests/test_content_api.py -v
```

Expected: All 10 FAIL with 404 or 405. This confirms tests are meaningful.

---

## Task 4: Add POST/PATCH/DELETE to /api/ways

**Files:**
- Modify: `server/api/routes.py`

- [ ] **Step 1: Replace `server/api/routes.py` entirely**

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2 import WKTElement
from geoalchemy2.shape import to_shape

from server.db.engine import get_db
from server.db.models import Way, User
from server.dependencies import get_current_user
from server.schemas.way import WayListResponse, WayDetail, WayPreview, SpotPreview
from server.schemas.content import CreateWayRequest, PatchWayRequest

router = APIRouter(prefix="/api/ways", tags=["ways"])


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    parts = [float(x) for x in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be west,south,east,north")
    return parts[0], parts[1], parts[2], parts[3]


def _polyline_to_wkt(coords: list[tuple[float, float]]) -> WKTElement | None:
    if len(coords) < 2:
        return None
    pts = ", ".join(f"{c[0]} {c[1]}" for c in coords)
    return WKTElement(f"LINESTRING({pts})", srid=4326)


def _way_to_preview(way: Way) -> WayPreview:
    polyline = []
    if way.preview_polyline is not None:
        shape = to_shape(way.preview_polyline)
        polyline = list(shape.coords)
    return WayPreview(
        id=way.id,
        name=way.name,
        theme=way.theme,
        spotCount=way.spot_count,
        distance=way.distance,
        duration=way.duration,
        coverPhoto=way.cover_photo,
        previewPolyline=polyline,
        heatBucket=way.heat_bucket,
        contentCount=way.content_count,
        savedCountLabel=way.saved_count_label,
    )


def _way_to_detail(way: Way) -> WayDetail:
    preview = _way_to_preview(way)
    spots = [SpotPreview.model_validate(s) for s in (way.spots or [])]
    return WayDetail(**preview.model_dump(), spots=spots)


@router.get("", response_model=WayListResponse)
async def list_ways(
    bbox: str | None = Query(default=None, description="west,south,east,north"),
    theme: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> WayListResponse:
    stmt = select(Way)
    if bbox:
        xmin, ymin, xmax, ymax = _parse_bbox(bbox)
        envelope = func.ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)
        stmt = stmt.where(func.ST_Intersects(Way.preview_polyline, envelope))
    if theme:
        stmt = stmt.where(Way.theme == theme)
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    ways = result.scalars().all()
    previews = [_way_to_preview(w) for w in ways]
    return WayListResponse(ways=previews, total=len(previews))


@router.get("/{way_id}", response_model=WayDetail)
async def get_way(way_id: str, db: AsyncSession = Depends(get_db)) -> WayDetail:
    result = await db.execute(select(Way).where(Way.id == way_id))
    way = result.scalar_one_or_none()
    if way is None:
        raise HTTPException(status_code=404, detail="Way not found")
    return _way_to_detail(way)


@router.post("", response_model=WayDetail, status_code=201)
async def create_way(
    body: CreateWayRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WayDetail:
    way = Way(
        id=str(uuid.uuid4()),
        name=body.name,
        theme=body.theme,
        spot_count=body.spotCount,
        distance=body.distance,
        duration=body.duration,
        cover_photo=body.coverPhoto,
        preview_polyline=_polyline_to_wkt(body.previewPolyline),
        heat_bucket=body.heatBucket,
        content_count=body.contentCount,
        saved_count_label=body.savedCountLabel,
        spots=body.spots,
        owner_id=current_user.id,
    )
    db.add(way)
    await db.commit()
    await db.refresh(way)
    return _way_to_detail(way)


@router.patch("/{way_id}", response_model=WayDetail)
async def patch_way(
    way_id: str,
    body: PatchWayRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WayDetail:
    result = await db.execute(select(Way).where(Way.id == way_id))
    way = result.scalar_one_or_none()
    if way is None:
        raise HTTPException(status_code=404, detail="Way not found")
    if way.owner_id is None or way.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        way.name = body.name
    if body.theme is not None:
        way.theme = body.theme
    if body.previewPolyline is not None:
        way.preview_polyline = _polyline_to_wkt(body.previewPolyline)
    if body.coverPhoto is not None:
        way.cover_photo = body.coverPhoto
    if body.heatBucket is not None:
        way.heat_bucket = body.heatBucket
    if body.spotCount is not None:
        way.spot_count = body.spotCount
    if body.distance is not None:
        way.distance = body.distance
    if body.duration is not None:
        way.duration = body.duration
    if body.contentCount is not None:
        way.content_count = body.contentCount
    if body.savedCountLabel is not None:
        way.saved_count_label = body.savedCountLabel
    if body.spots is not None:
        way.spots = body.spots

    await db.commit()
    await db.refresh(way)
    return _way_to_detail(way)


@router.delete("/{way_id}", status_code=204)
async def delete_way(
    way_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(select(Way).where(Way.id == way_id))
    way = result.scalar_one_or_none()
    if way is None:
        raise HTTPException(status_code=404, detail="Way not found")
    if way.owner_id is None or way.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(way)
    await db.commit()
```

---

## Task 5: Add POST/PATCH/DELETE to /api/spots

**Files:**
- Modify: `server/api/spots.py`

- [ ] **Step 1: Replace `server/api/spots.py` entirely**

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2 import WKTElement
from geoalchemy2.shape import to_shape

from server.db.engine import get_db
from server.db.models import Spot, User
from server.dependencies import get_current_user
from server.schemas.spot import SpotDetail, SpotListResponse, SpotPhoto, SpotContent, WayReference
from server.schemas.way import SpotPreview, SpotRegion
from server.schemas.content import CreateSpotRequest, PatchSpotRequest

router = APIRouter(prefix="/api/spots", tags=["spots"])


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    parts = [float(x) for x in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be west,south,east,north")
    return parts[0], parts[1], parts[2], parts[3]


def _coord_to_wkt(coordinate: tuple[float, float]) -> WKTElement:
    return WKTElement(f"POINT({coordinate[0]} {coordinate[1]})", srid=4326)


def _spot_to_preview(spot: Spot) -> SpotPreview:
    shape = to_shape(spot.location)
    return SpotPreview(
        id=spot.id,
        name=spot.name,
        coordinate=(shape.x, shape.y),
        category=spot.category,
        region=SpotRegion(**spot.region) if spot.region else None,
    )


def _spot_to_detail(spot: Spot) -> SpotDetail:
    shape = to_shape(spot.location)
    return SpotDetail(
        id=spot.id,
        name=spot.name,
        coordinate=(shape.x, shape.y),
        category=spot.category,
        region=SpotRegion(**spot.region) if spot.region else None,
        tags=spot.tags or [],
        photos=[SpotPhoto(**p) for p in (spot.photos or [])],
        wayIds=spot.way_ids or [],
        contents=[SpotContent.model_validate(c) for c in (spot.contents or [])],
        relatedWays=[WayReference(**r) for r in (spot.related_ways or [])],
    )


@router.get("", response_model=SpotListResponse)
async def list_spots(
    bbox: str | None = Query(default=None, description="west,south,east,north"),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> SpotListResponse:
    stmt = select(Spot)
    if bbox:
        xmin, ymin, xmax, ymax = _parse_bbox(bbox)
        envelope = func.ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)
        stmt = stmt.where(func.ST_Within(Spot.location, envelope))
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    spots = result.scalars().all()
    previews = [_spot_to_preview(s) for s in spots]
    return SpotListResponse(spots=previews, total=len(previews))


@router.get("/{spot_id}", response_model=SpotDetail)
async def get_spot(spot_id: str, db: AsyncSession = Depends(get_db)) -> SpotDetail:
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if spot is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    return _spot_to_detail(spot)


@router.post("", response_model=SpotDetail, status_code=201)
async def create_spot(
    body: CreateSpotRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SpotDetail:
    spot = Spot(
        id=str(uuid.uuid4()),
        name=body.name,
        category=body.category,
        location=_coord_to_wkt(body.coordinate),
        region=body.region,
        tags=body.tags,
        photos=body.photos,
        way_ids=body.wayIds,
        contents=body.contents,
        related_ways=body.relatedWays,
        owner_id=current_user.id,
    )
    db.add(spot)
    await db.commit()
    await db.refresh(spot)
    return _spot_to_detail(spot)


@router.patch("/{spot_id}", response_model=SpotDetail)
async def patch_spot(
    spot_id: str,
    body: PatchSpotRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SpotDetail:
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if spot is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.owner_id is None or spot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        spot.name = body.name
    if body.category is not None:
        spot.category = body.category
    if body.coordinate is not None:
        spot.location = _coord_to_wkt(body.coordinate)
    if body.region is not None:
        spot.region = body.region
    if body.tags is not None:
        spot.tags = body.tags
    if body.photos is not None:
        spot.photos = body.photos
    if body.wayIds is not None:
        spot.way_ids = body.wayIds
    if body.contents is not None:
        spot.contents = body.contents
    if body.relatedWays is not None:
        spot.related_ways = body.relatedWays

    await db.commit()
    await db.refresh(spot)
    return _spot_to_detail(spot)


@router.delete("/{spot_id}", status_code=204)
async def delete_spot(
    spot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if spot is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.owner_id is None or spot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(spot)
    await db.commit()
```

---

## Task 6: Run all tests and commit

- [ ] **Step 1: Run all tests**

```bash
pytest tests/ -v
```

Expected: All 35 tests PASS (25 existing + 10 new content tests).

If `test_patch_seed_way_returns_403` fails, check that the seeded ways have `owner_id=NULL` in the DB:
```bash
python -c "
import asyncio
from sqlalchemy import text
from server.db.engine import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as s:
        r = await s.execute(text('SELECT id, owner_id FROM ways LIMIT 3'))
        print(list(r))
asyncio.run(check())
"
```
Expected: all rows have `owner_id=None`.

- [ ] **Step 2: Commit**

```bash
git add server/db/models.py server/alembic/versions/004_add_owner_id.py server/schemas/content.py server/api/routes.py server/api/spots.py tests/test_content_api.py
git commit -m "feat: add content creation API (POST/PATCH/DELETE for ways and spots)"
```

---

## Task 7: Update Wiki

**Files:**
- Modify: `wiki/02-system-architecture.md`

- [ ] **Step 1: Add new endpoints to the API routes section**

```
POST   /api/ways             — 创建路线（需 auth）
PATCH  /api/ways/{id}        — 部分更新路线（需 auth，本人）
DELETE /api/ways/{id}        — 删除路线（需 auth，本人）
POST   /api/spots            — 创建地点（需 auth）
PATCH  /api/spots/{id}       — 部分更新地点（需 auth，本人）
DELETE /api/spots/{id}       — 删除地点（需 auth，本人）
```

- [ ] **Step 2: Note owner_id added to ways and spots tables**

In the database tables section, add a note that `ways` and `spots` now have `owner_id VARCHAR NULL` for ownership tracking.

- [ ] **Step 3: Commit**

```bash
git add wiki/02-system-architecture.md
git commit -m "docs: update wiki with content creation endpoints"
```
