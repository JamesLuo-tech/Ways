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
