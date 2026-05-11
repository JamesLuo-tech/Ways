"""
Import mock data into PostgreSQL.
Run: python -m server.scripts.seed
"""
import asyncio
from geoalchemy2 import WKTElement
from sqlalchemy import text

from server.db.engine import AsyncSessionLocal
from server.db.models import Way, Spot
from server.services.mock_data import WAYS, WAY_SPOTS, SPOTS


def _linestring(coords) -> WKTElement:
    pts = ", ".join(f"{c[0]} {c[1]}" for c in coords)
    return WKTElement(f"LINESTRING({pts})", srid=4326)


def _point(coord) -> WKTElement:
    return WKTElement(f"POINT({coord[0]} {coord[1]})", srid=4326)


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM spots"))
        await session.execute(text("DELETE FROM ways"))

        for way in WAYS:
            db_way = Way(
                id=way.id,
                name=way.name,
                theme=way.theme,
                spot_count=way.spotCount,
                distance=way.distance,
                duration=way.duration,
                cover_photo=way.coverPhoto,
                preview_polyline=_linestring(way.previewPolyline),
                heat_bucket=way.heatBucket,
                content_count=way.contentCount,
                saved_count_label=way.savedCountLabel,
                spots=[s.model_dump() for s in WAY_SPOTS[way.id]],
            )
            session.add(db_way)

        for spot_id, spot in SPOTS.items():
            db_spot = Spot(
                id=spot.id,
                name=spot.name,
                category=spot.category,
                location=_point(spot.coordinate),
                region=spot.region.model_dump() if spot.region else None,
                tags=list(spot.tags),
                photos=[p.model_dump() for p in spot.photos],
                way_ids=list(spot.wayIds),
                contents=[c.model_dump() for c in spot.contents],
                related_ways=[r.model_dump() for r in spot.relatedWays],
            )
            session.add(db_spot)

        await session.commit()
        print(f"Seeded {len(WAYS)} ways and {len(SPOTS)} spots.")


if __name__ == "__main__":
    asyncio.run(seed())
