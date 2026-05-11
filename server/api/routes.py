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
