from pydantic import BaseModel, Field

from .way import Coordinate, HeatBucket, SpotCategory, SpotPreview, SpotRegion


class SpotPhoto(BaseModel):
    url: str
    takenAt: str


class UserProfileStats(BaseModel):
    archiveCount: int
    distanceKm: float
    spotCount: int
    photoCount: int


class UserProfileSummary(BaseModel):
    id: str
    displayName: str
    avatarUrl: str
    bio: str
    homeBase: str
    stats: UserProfileStats


class TravelArchiveStats(BaseModel):
    distanceKm: float
    durationHours: float
    spotCount: int
    photoCount: int


class ArchiveStopSummary(SpotPreview):
    sequence: int


class TravelArchiveSummary(BaseModel):
    id: str
    title: str
    regionName: str
    routeSignature: list[Coordinate]
    stops: list[ArchiveStopSummary] = Field(default_factory=list)
    stats: TravelArchiveStats


class WayReference(BaseModel):
    id: str
    name: str
    heatBucket: HeatBucket


class SpotContent(BaseModel):
    id: str
    spotId: str
    owner: UserProfileSummary
    archive: TravelArchiveSummary
    coverAssetUrl: str
    capturedAt: str
    tags: list[str]
    visibility: str
    sourceType: str


class SpotDetail(BaseModel):
    id: str
    name: str
    coordinate: Coordinate
    category: SpotCategory
    region: SpotRegion | None = None
    tags: list[str]
    photos: list[SpotPhoto]
    wayIds: list[str]
    contents: list[SpotContent]
    relatedWays: list[WayReference]


class SpotListResponse(BaseModel):
    spots: list[SpotPreview]
    total: int
