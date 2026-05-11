# Backend Database & API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory mock data with PostgreSQL 16 + PostGIS 3.4; keep `/api/ways` and `/api/spots` contract identical.

**Architecture:** SQLAlchemy 2.0 async ORM + GeoAlchemy2 for geometry columns. Alembic manages schema. FastAPI dependency injection provides per-request DB sessions. Existing Pydantic response schemas are unchanged.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 asyncio, GeoAlchemy2, asyncpg, Alembic, shapely, python-dotenv, pytest, pytest-asyncio, httpx

---

## File Map

**Create:**
- `server/db/__init__.py` — package marker
- `server/db/engine.py` — async engine, `AsyncSessionLocal`, `Base`, `get_db`
- `server/db/models.py` — `Way` and `Spot` ORM models
- `server/scripts/__init__.py` — package marker
- `server/scripts/seed.py` — import mock data into DB
- `server/alembic/env.py` — Alembic async env (replaces generated file)
- `server/alembic/versions/001_initial_schema.py` — creates ways + spots tables
- `alembic.ini` — Alembic config at project root
- `tests/__init__.py` — package marker
- `tests/conftest.py` — async HTTP client fixture
- `tests/test_ways_api.py` — tests for /api/ways endpoints
- `tests/test_spots_api.py` — tests for /api/spots endpoints
- `pytest.ini` — asyncio_mode = auto

**Modify:**
- `server/requirements.txt` — add new deps
- `server/main.py` — add lifespan + 503 handler
- `server/api/routes.py` — replace mock with async DB queries
- `server/api/spots.py` — replace mock with async DB queries

---

## Task 1: Update dependencies

**Files:**
- Modify: `server/requirements.txt`

- [ ] **Step 1: Replace requirements.txt with this exact content**

```
fastapi==0.115.12
uvicorn==0.34.2
pydantic==2.11.3
sqlalchemy[asyncio]>=2.0
geoalchemy2>=0.15
asyncpg>=0.29
shapely>=2.0
alembic>=1.13
python-dotenv>=1.0
pytest>=8.0
pytest-asyncio>=0.23
httpx>=0.27
```

- [ ] **Step 2: Install**

```bash
pip install -r server/requirements.txt
```

Expected: No errors.

- [ ] **Step 3: Verify**

```bash
python -c "import sqlalchemy, geoalchemy2, asyncpg, alembic, shapely; print('OK')"
```

Expected: `OK`

---

## Task 2: Create DB engine module

**Files:**
- Create: `server/db/__init__.py`
- Create: `server/db/engine.py`

- [ ] **Step 1: Create `server/db/__init__.py`** (empty file)

- [ ] **Step 2: Create `server/db/engine.py`**

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 3: Verify `.env` at project root has the correct URL**

```
DATABASE_URL=postgresql+asyncpg://postgres:ways123@localhost/ways
```

Note: `+asyncpg` is required — the plain `postgresql://` URL will fail with the async engine.

- [ ] **Step 4: Verify engine loads**

```bash
python -c "from server.db.engine import engine; print(engine.url)"
```

Expected: `postgresql+asyncpg://postgres:***@localhost/ways`

---

## Task 3: Create ORM models

**Files:**
- Create: `server/db/models.py`

- [ ] **Step 1: Create `server/db/models.py`**

```python
from typing import Optional
from sqlalchemy import String, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from server.db.engine import Base


class Way(Base):
    __tablename__ = "ways"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    theme: Mapped[str] = mapped_column(String, nullable=False)
    spot_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    distance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cover_photo: Mapped[str] = mapped_column(String, nullable=False, default="")
    preview_polyline: Mapped[Optional[object]] = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )
    heat_bucket: Mapped[str] = mapped_column(String, nullable=False)
    content_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    saved_count_label: Mapped[str] = mapped_column(String, nullable=False, default="0")
    spots: Mapped[Optional[object]] = mapped_column(JSONB, nullable=True)


class Spot(Base):
    __tablename__ = "spots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[object] = mapped_column(
        Geometry("POINT", srid=4326), nullable=False
    )
    region: Mapped[Optional[object]] = mapped_column(JSONB, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    photos: Mapped[Optional[object]] = mapped_column(JSONB, nullable=True)
    way_ids: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    contents: Mapped[Optional[object]] = mapped_column(JSONB, nullable=True)
    related_ways: Mapped[Optional[object]] = mapped_column(JSONB, nullable=True)
```

- [ ] **Step 2: Verify models import**

```bash
python -c "from server.db.models import Way, Spot; print(Way.__tablename__, Spot.__tablename__)"
```

Expected: `ways spots`

---

## Task 4: Setup Alembic

**Files:**
- Create: `alembic.ini`
- Create: `server/alembic/env.py` (replace generated)

- [ ] **Step 1: Run Alembic init**

```bash
alembic init server/alembic
```

Expected: Creates `alembic.ini` at project root and `server/alembic/` directory.

- [ ] **Step 2: Update `alembic.ini`**

Find the line `script_location = alembic` and change it to:
```ini
script_location = server/alembic
```

Leave everything else unchanged. The DB URL will be set in env.py.

- [ ] **Step 3: Replace `server/alembic/env.py` entirely**

```python
import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from dotenv import load_dotenv

load_dotenv()

import server.db.models  # noqa: F401 — registers models on Base.metadata
from server.db.engine import Base

config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Verify Alembic connects to DB**

```bash
alembic current
```

Expected: Output with no errors (shows current revision, likely `(head)` or empty).

---

## Task 5: Create and run initial migration

**Files:**
- Create: `server/alembic/versions/001_initial_schema.py`

- [ ] **Step 1: Create `server/alembic/versions/001_initial_schema.py`**

```python
"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from geoalchemy2 import Geometry

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "ways",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("theme", sa.String(), nullable=False),
        sa.Column("spot_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("distance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cover_photo", sa.String(), nullable=False, server_default=""),
        sa.Column("preview_polyline", Geometry("LINESTRING", srid=4326), nullable=True),
        sa.Column("heat_bucket", sa.String(), nullable=False),
        sa.Column("content_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("saved_count_label", sa.String(), nullable=False, server_default="0"),
        sa.Column("spots", JSONB(), nullable=True),
    )

    op.create_table(
        "spots",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("location", Geometry("POINT", srid=4326), nullable=False),
        sa.Column("region", JSONB(), nullable=True),
        sa.Column("tags", ARRAY(sa.Text()), nullable=True),
        sa.Column("photos", JSONB(), nullable=True),
        sa.Column("way_ids", ARRAY(sa.Text()), nullable=True),
        sa.Column("contents", JSONB(), nullable=True),
        sa.Column("related_ways", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("spots")
    op.drop_table("ways")
```

- [ ] **Step 2: Run the migration**

```bash
alembic upgrade head
```

Expected:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001, initial schema
```

- [ ] **Step 3: Verify in pgAdmin**

In pgAdmin → `ways` database → Schemas → public → Tables.
Should see: `ways`, `spots` (plus PostGIS system tables like `spatial_ref_sys`).

---

## Task 6: Create and run seed script

**Files:**
- Create: `server/scripts/__init__.py`
- Create: `server/scripts/seed.py`

- [ ] **Step 1: Create `server/scripts/__init__.py`** (empty file)

- [ ] **Step 2: Create `server/scripts/seed.py`**

```python
"""
Import mock data into PostgreSQL.
Run: python -m server.scripts.seed
"""
import asyncio
from geoalchemy2 import WKTElement
from sqlalchemy import text

from server.db.engine import AsyncSessionLocal
from server.db.models import Way, Spot
from server.services.mock_data import WAYS, WAY_SPOTS, SPOTS


def _linestring(coords) -> WKTElement:
    pts = ", ".join(f"{c[0]} {c[1]}" for c in coords)
    return WKTElement(f"LINESTRING({pts})", srid=4326)


def _point(coord) -> WKTElement:
    return WKTElement(f"POINT({coord[0]} {coord[1]})", srid=4326)


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM spots"))
        await session.execute(text("DELETE FROM ways"))

        for way in WAYS:
            db_way = Way(
                id=way.id,
                name=way.name,
                theme=way.theme,
                spot_count=way.spotCount,
                distance=way.distance,
                duration=way.duration,
                cover_photo=way.coverPhoto,
                preview_polyline=_linestring(way.previewPolyline),
                heat_bucket=way.heatBucket,
                content_count=way.contentCount,
                saved_count_label=way.savedCountLabel,
                spots=[s.model_dump() for s in WAY_SPOTS[way.id]],
            )
            session.add(db_way)

        for spot_id, spot in SPOTS.items():
            db_spot = Spot(
                id=spot.id,
                name=spot.name,
                category=spot.category,
                location=_point(spot.coordinate),
                region=spot.region.model_dump() if spot.region else None,
                tags=list(spot.tags),
                photos=[p.model_dump() for p in spot.photos],
                way_ids=list(spot.wayIds),
                contents=[c.model_dump() for c in spot.contents],
                related_ways=[r.model_dump() for r in spot.relatedWays],
            )
            session.add(db_spot)

        await session.commit()
        print(f"Seeded {len(WAYS)} ways and {len(SPOTS)} spots.")


if __name__ == "__main__":
    asyncio.run(seed())
```

- [ ] **Step 3: Run seed**

```bash
python -m server.scripts.seed
```

Expected:
```
Seeded 3 ways and 9 spots.
```

- [ ] **Step 4: Verify in pgAdmin Query Tool**

```sql
SELECT id, name, heat_bucket FROM ways;
SELECT id, name, category FROM spots;
```

Expected: 3 rows in ways, 9 rows in spots.

---

## Task 7: Write API tests (before touching route handlers)

**Files:**
- Create: `tests/__init__.py`
- Create: `tests/conftest.py`
- Create: `tests/test_ways_api.py`
- Create: `tests/test_spots_api.py`
- Create: `pytest.ini`

- [ ] **Step 1: Create `tests/__init__.py`** (empty file)

- [ ] **Step 2: Create `tests/conftest.py`**

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
```

- [ ] **Step 3: Create `tests/test_ways_api.py`**

```python
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
```

- [ ] **Step 4: Create `tests/test_spots_api.py`**

```python
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
```

- [ ] **Step 5: Create `pytest.ini`**

```ini
[pytest]
asyncio_mode = auto
```

- [ ] **Step 6: Run tests — expect them to PASS against mock data**

```bash
pytest tests/ -v
```

Expected: All 12 tests PASS. (Routes still use mock data at this point — this is the baseline.)

---

## Task 8: Update server/main.py

**Files:**
- Modify: `server/main.py`

- [ ] **Step 1: Replace `server/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from server.api.routes import router as ways_router
from server.api.spots import router as spots_router
from server.db.engine import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(title="Ways API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ways_router)
app.include_router(spots_router)


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 2: Verify server starts**

```bash
uvicorn server.main:app --reload
```

Expected: Server starts without errors. `GET http://localhost:8000/healthz` returns `{"status": "ok"}`.

Stop the server (Ctrl+C).

---

## Task 9: Update /api/ways to use DB

**Files:**
- Modify: `server/api/routes.py`

- [ ] **Step 1: Replace `server/api/routes.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.shape import to_shape

from server.db.engine import get_db
from server.db.models import Way
from server.schemas.way import WayListResponse, WayDetail, WayPreview, SpotPreview

router = APIRouter(prefix="/api/ways", tags=["ways"])


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    parts = [float(x) for x in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be west,south,east,north")
    return parts[0], parts[1], parts[2], parts[3]


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
```

- [ ] **Step 2: Run ways tests**

```bash
pytest tests/test_ways_api.py -v
```

Expected: All 6 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/db/ server/scripts/ server/alembic/ alembic.ini server/main.py server/api/routes.py server/requirements.txt tests/ pytest.ini
git commit -m "feat: connect ways API to PostgreSQL + PostGIS"
```

---

## Task 10: Update /api/spots to use DB

**Files:**
- Modify: `server/api/spots.py`

- [ ] **Step 1: Replace `server/api/spots.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.shape import to_shape

from server.db.engine import get_db
from server.db.models import Spot
from server.schemas.spot import SpotDetail, SpotListResponse, SpotPhoto, SpotContent, WayReference
from server.schemas.way import SpotPreview, SpotRegion

router = APIRouter(prefix="/api/spots", tags=["spots"])


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    parts = [float(x) for x in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be west,south,east,north")
    return parts[0], parts[1], parts[2], parts[3]


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
```

- [ ] **Step 2: Run all tests**

```bash
pytest tests/ -v
```

Expected: All 12 tests PASS.

- [ ] **Step 3: Manual smoke test**

Start the server:
```bash
uvicorn server.main:app --reload
```

Check these URLs return real data:
- `http://localhost:8000/api/ways` — 3 ways, real polylines
- `http://localhost:8000/api/spots` — 9 spots
- `http://localhost:8000/api/ways/way-mogan-wine` — way detail with spots list
- `http://localhost:8000/api/spots/spot-qingzhiwu` — spot detail with photos + contents

- [ ] **Step 4: Final commit**

```bash
git add server/api/spots.py
git commit -m "feat: connect spots API to PostgreSQL + PostGIS"
```

---

## Task 11: Update Wiki

**Files:**
- Modify: `wiki/02-system-architecture.md`

- [ ] **Step 1: In `wiki/02-system-architecture.md`, update the backend status section**

Replace any text that says "in-memory seed data (no PostgreSQL yet)" or similar with:

> Backend now uses PostgreSQL 16 + PostGIS 3.4 via SQLAlchemy 2.0 async ORM (GeoAlchemy2).
> - `server/db/engine.py` — async engine + `get_db` dependency
> - `server/db/models.py` — `Way` and `Spot` ORM models with geometry columns
> - Alembic manages migrations: run `alembic upgrade head` to create tables
> - Seed initial data: `python -m server.scripts.seed`

- [ ] **Step 2: Commit**

```bash
git add wiki/02-system-architecture.md
git commit -m "docs: update architecture wiki to reflect PostgreSQL integration"
```
