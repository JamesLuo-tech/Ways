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
