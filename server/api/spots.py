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
