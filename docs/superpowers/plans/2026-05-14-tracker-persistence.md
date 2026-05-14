# Tracker Session Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist GPS track sessions to PostgreSQL so Tracker tab data survives app restarts; four authenticated endpoints: save, list, get detail, delete.

**Architecture:** Single `track_sessions` table — full GPS points in JSONB, simplified PostGIS LINESTRING (≤200 pts) for map rendering, Haversine distance computed on save. All endpoints require Bearer JWT via `get_current_user`. Owner-only access for detail and delete.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, GeoAlchemy2, PostGIS, python-jose, pytest-asyncio

---

## File Map

**Create:**
- `server/schemas/tracker.py` — request/response Pydantic models
- `server/api/tracker.py` — 4 route handlers + helpers
- `server/alembic/versions/003_add_track_sessions.py` — creates track_sessions table
- `tests/test_tracker_api.py` — 7 tests

**Modify:**
- `server/db/models.py` — add TrackSession ORM model
- `server/main.py` — include tracker router

---

## Task 1: Add TrackSession ORM model and run migration

**Files:**
- Modify: `server/db/models.py`
- Create: `server/alembic/versions/003_add_track_sessions.py`

- [ ] **Step 1: Append TrackSession to `server/db/models.py`**

Add this class after the existing User class (keep Way, Spot, User unchanged):

```python
class TrackSession(Base):
    __tablename__ = "track_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    track: Mapped[Optional[Any]] = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )
    points: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    photo_clusters: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    distance_m: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration_s: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
```

Note: `datetime`, `timezone` are already imported at the top of models.py from the User class addition.

- [ ] **Step 2: Verify model import**

```bash
python -c "from server.db.models import TrackSession; print(TrackSession.__tablename__)"
```

Expected: `track_sessions`

- [ ] **Step 3: Create `server/alembic/versions/003_add_track_sessions.py`**

```python
"""add track_sessions table

Revision ID: 003
Revises: 002
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from geoalchemy2 import Geometry

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "track_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("track", Geometry("LINESTRING", srid=4326), nullable=True),
        sa.Column("points", JSONB(), nullable=True),
        sa.Column("photo_clusters", JSONB(), nullable=True),
        sa.Column("tags", ARRAY(sa.Text()), nullable=True),
        sa.Column("distance_m", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_s", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_track_sessions_user_id", "track_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_track_sessions_user_id", "track_sessions")
    op.drop_table("track_sessions")
```

- [ ] **Step 4: Run migration**

```bash
alembic upgrade head
```

Expected:
```
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003, add track_sessions table
```

---

## Task 2: Create Pydantic schemas

**Files:**
- Create: `server/schemas/tracker.py`

- [ ] **Step 1: Create `server/schemas/tracker.py`**

```python
from datetime import datetime
from pydantic import BaseModel


class TrackPointInput(BaseModel):
    latitude: float
    longitude: float
    altitude: float | None = None
    timestamp: int  # unix ms
    speed: float | None = None
    accuracy: float | None = None


class PhotoInput(BaseModel):
    uri: str
    latitude: float
    longitude: float
    timestamp: int  # unix ms


class PhotoClusterInput(BaseModel):
    id: str
    coordinate: tuple[float, float]
    photos: list[PhotoInput]
    representativePhoto: PhotoInput


class CreateSessionRequest(BaseModel):
    startedAt: int  # unix ms
    endedAt: int | None = None
    points: list[TrackPointInput]
    photoClusters: list[PhotoClusterInput] = []
    tags: list[str] = []


class CreateSessionResponse(BaseModel):
    id: str
    distanceM: int
    durationS: int


class SessionSummary(BaseModel):
    id: str
    startedAt: int  # unix ms
    endedAt: int | None
    distanceM: int
    durationS: int
    tags: list[str]
    photoCount: int
    createdAt: datetime


class SessionDetail(SessionSummary):
    points: list[dict]
    photoClusters: list[dict]


class SessionListResponse(BaseModel):
    sessions: list[SessionSummary]
    total: int
```

- [ ] **Step 2: Verify import**

```bash
python -c "from server.schemas.tracker import CreateSessionRequest, SessionDetail; print('OK')"
```

Expected: `OK`

---

## Task 3: Write failing tests

**Files:**
- Create: `tests/test_tracker_api.py`

- [ ] **Step 1: Create `tests/test_tracker_api.py`**

```python
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
```

- [ ] **Step 2: Run tests — expect all 7 to FAIL**

```bash
pytest tests/test_tracker_api.py -v
```

Expected: All 7 FAIL with 404 (tracker router not wired yet). This confirms tests are meaningful.

---

## Task 4: Create route handlers

**Files:**
- Create: `server/api/tracker.py`

- [ ] **Step 1: Create `server/api/tracker.py`**

```python
import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from geoalchemy2 import WKTElement

from server.db.engine import get_db
from server.db.models import TrackSession, User
from server.dependencies import get_current_user
from server.schemas.tracker import (
    CreateSessionRequest,
    CreateSessionResponse,
    SessionDetail,
    SessionListResponse,
    SessionSummary,
)

router = APIRouter(prefix="/api/tracker", tags=["tracker"])


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _compute_distance_m(points: list[dict]) -> int:
    total = 0.0
    for i in range(1, len(points)):
        p1, p2 = points[i - 1], points[i]
        total += _haversine_m(
            p1["latitude"], p1["longitude"], p2["latitude"], p2["longitude"]
        )
    return int(total)


def _make_linestring(points: list[dict]) -> WKTElement | None:
    if len(points) < 2:
        return None
    step = max(1, len(points) // 200)
    sampled = points[::step]
    coords = ", ".join(f"{p['longitude']} {p['latitude']}" for p in sampled)
    return WKTElement(f"LINESTRING({coords})", srid=4326)


def _to_summary(session: TrackSession) -> SessionSummary:
    photo_count = sum(
        len(c.get("photos", [])) for c in (session.photo_clusters or [])
    )
    return SessionSummary(
        id=session.id,
        startedAt=int(session.started_at.timestamp() * 1000),
        endedAt=int(session.ended_at.timestamp() * 1000) if session.ended_at else None,
        distanceM=session.distance_m,
        durationS=session.duration_s,
        tags=session.tags or [],
        photoCount=photo_count,
        createdAt=session.created_at,
    )


@router.post("/sessions", response_model=CreateSessionResponse, status_code=201)
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreateSessionResponse:
    if not body.points:
        raise HTTPException(status_code=400, detail="points must not be empty")

    points_data = [p.model_dump() for p in body.points]
    clusters_data = [c.model_dump() for c in body.photoClusters]

    distance_m = _compute_distance_m(points_data)
    duration_s = (body.endedAt - body.startedAt) // 1000 if body.endedAt else 0

    started_at = datetime.fromtimestamp(body.startedAt / 1000, tz=timezone.utc)
    ended_at = (
        datetime.fromtimestamp(body.endedAt / 1000, tz=timezone.utc)
        if body.endedAt
        else None
    )

    session = TrackSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        started_at=started_at,
        ended_at=ended_at,
        track=_make_linestring(points_data),
        points=points_data,
        photo_clusters=clusters_data,
        tags=body.tags,
        distance_m=distance_m,
        duration_s=duration_s,
    )
    db.add(session)
    await db.commit()
    return CreateSessionResponse(
        id=session.id, distanceM=distance_m, durationS=duration_s
    )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionListResponse:
    result = await db.execute(
        select(TrackSession)
        .where(TrackSession.user_id == current_user.id)
        .order_by(TrackSession.started_at.desc())
    )
    sessions = result.scalars().all()
    summaries = [_to_summary(s) for s in sessions]
    return SessionListResponse(sessions=summaries, total=len(summaries))


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionDetail:
    result = await db.execute(
        select(TrackSession).where(TrackSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    photo_count = sum(
        len(c.get("photos", [])) for c in (session.photo_clusters or [])
    )
    return SessionDetail(
        id=session.id,
        startedAt=int(session.started_at.timestamp() * 1000),
        endedAt=int(session.ended_at.timestamp() * 1000) if session.ended_at else None,
        distanceM=session.distance_m,
        durationS=session.duration_s,
        tags=session.tags or [],
        photoCount=photo_count,
        createdAt=session.created_at,
        points=session.points or [],
        photoClusters=session.photo_clusters or [],
    )


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(TrackSession).where(TrackSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(session)
    await db.commit()
```

---

## Task 5: Wire router, run all tests, commit

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

from server.api.auth import router as auth_router
from server.api.routes import router as ways_router
from server.api.spots import router as spots_router
from server.api.tracker import router as tracker_router
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

app.include_router(auth_router)
app.include_router(ways_router)
app.include_router(spots_router)
app.include_router(tracker_router)


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 2: Run all tests**

```bash
pytest tests/ -v
```

Expected: All 25 tests PASS (18 existing + 7 new tracker tests).

- [ ] **Step 3: Commit everything**

```bash
git add server/db/models.py server/alembic/versions/003_add_track_sessions.py server/schemas/tracker.py server/api/tracker.py server/main.py tests/test_tracker_api.py
git commit -m "feat: add tracker session persistence API"
```

---

## Task 6: Update Wiki

**Files:**
- Modify: `wiki/02-system-architecture.md`

- [ ] **Step 1: Add tracker endpoints to API routes section**

```
POST   /api/tracker/sessions         — 保存轨迹会话（需 auth）
GET    /api/tracker/sessions         — 列出当前用户的会话（需 auth）
GET    /api/tracker/sessions/{id}    — 会话详情，含全量 GPS 点（需 auth，仅限本人）
DELETE /api/tracker/sessions/{id}    — 删除会话（需 auth，仅限本人）
```

- [ ] **Step 2: Add track_sessions to database tables section**

```
track_sessions — id, user_id, started_at, ended_at, track (LINESTRING), points (JSONB),
                 photo_clusters (JSONB), tags, distance_m, duration_s, created_at
```

- [ ] **Step 3: Commit**

```bash
git add wiki/02-system-architecture.md
git commit -m "docs: update wiki with tracker session endpoints"
```
