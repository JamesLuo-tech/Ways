from typing import Literal

from pydantic import BaseModel

Coordinate = tuple[float, float]
WayTheme = Literal["hiking", "wine", "coffee", "ancient-town", "cycling", "custom"]
SpotCategory = Literal["scenic", "food", "camp", "viewpoint", "culture", "other"]
HeatBucket = Literal["emerging", "hot", "classic", "editorial"]


class SpotRegion(BaseModel):
    province: str
    city: str
    district: str | None = None
    area: str | None = None


class SpotPreview(BaseModel):
    id: str
    name: str
    coordinate: Coordinate
    category: SpotCategory
    region: SpotRegion | None = None


class WayPreview(BaseModel):
    id: str
    name: str
    theme: WayTheme
    spotCount: int
    distance: int
    duration: int
    coverPhoto: str
    previewPolyline: list[Coordinate]
    heatBucket: HeatBucket
    contentCount: int
    savedCountLabel: str


class WayDetail(WayPreview):
    spots: list[SpotPreview]


class WayListResponse(BaseModel):
    ways: list[WayPreview]
    total: int
