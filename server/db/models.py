from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from server.db.engine import Base


class Way(Base):
    __tablename__ = "ways"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    theme: Mapped[str] = mapped_column(String, nullable=False)
    spot_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    distance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cover_photo: Mapped[str] = mapped_column(String, nullable=False, default="")
    preview_polyline: Mapped[Optional[Any]] = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )
    heat_bucket: Mapped[str] = mapped_column(String, nullable=False)
    content_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    saved_count_label: Mapped[str] = mapped_column(String, nullable=False, default="0")
    spots: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)


class Spot(Base):
    __tablename__ = "spots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[Any] = mapped_column(
        Geometry("POINT", srid=4326), nullable=False
    )
    region: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    photos: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    way_ids: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    contents: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    related_ways: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    home_base: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


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
