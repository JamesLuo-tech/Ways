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
