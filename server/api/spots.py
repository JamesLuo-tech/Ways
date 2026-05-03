from fastapi import APIRouter, HTTPException, Query

from server.schemas.spot import SpotDetail, SpotListResponse
from server.services.mock_data import SPOTS, filter_spots

router = APIRouter(prefix="/api/spots", tags=["spots"])


@router.get("", response_model=SpotListResponse)
def list_spots(
    bbox: str | None = Query(default=None, description="west,south,east,north"),
    limit: int = Query(default=50, ge=1, le=200),
) -> SpotListResponse:
    spots, total = filter_spots(bbox=bbox, limit=limit)
    return SpotListResponse(spots=spots, total=total)


@router.get("/{spot_id}", response_model=SpotDetail)
def get_spot(spot_id: str) -> SpotDetail:
    spot = SPOTS.get(spot_id)
    if spot is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot
