from fastapi import APIRouter, HTTPException, Query

from server.schemas.way import WayDetail, WayListResponse
from server.services.mock_data import WAY_DETAILS, filter_ways

router = APIRouter(prefix="/api/ways", tags=["ways"])


@router.get("", response_model=WayListResponse)
def list_ways(
    bbox: str | None = Query(default=None, description="west,south,east,north"),
    theme: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> WayListResponse:
    ways, total = filter_ways(bbox=bbox, theme=theme, limit=limit)
    return WayListResponse(ways=ways, total=total)


@router.get("/{way_id}", response_model=WayDetail)
def get_way(way_id: str) -> WayDetail:
    way = WAY_DETAILS.get(way_id)
    if way is None:
        raise HTTPException(status_code=404, detail="Way not found")
    return way
