# Backend Database & API Design

**Date:** 2026-05-11
**Scope:** Replace in-memory mock data with real PostgreSQL + PostGIS database; keep existing API contract intact.
**Approach:** Minimal/pragmatic (Approach A) — core tables first, JSONB for nested objects, expand later.

---

## Goals

- Connect FastAPI backend to a real PostgreSQL 16 + PostGIS 3.4 database
- Two core tables: `ways` and `spots`
- Alembic for schema migrations
- Seed script to import existing mock data (9 Spots, 3 Ways) as initial data
- Zero changes to frontend API contract (`/api/ways`, `/api/spots` request/response shapes stay identical)

## Non-Goals (deferred)

- User authentication / JWT
- Photo upload (Supabase Storage)
- Track session persistence
- Splitting JSONB columns into normalized tables (done when auth is added)
- Docker / deployment

---

## Database Schema

### `ways` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Primary key |
| `title` | VARCHAR | Route name |
| `heat_bucket` | VARCHAR | hot / trending / classic / curated |
| `theme` | VARCHAR NULL | Route theme |
| `preview_polyline` | GEOMETRY(LINESTRING, 4326) | PostGIS line for map rendering |
| `content_count` | INTEGER | Number of content items |
| `saved_count_label` | VARCHAR | Display string e.g. "1.2k" |
| `spots` | JSONB | Denormalized list of SpotPreview objects |

### `spots` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Primary key |
| `name` | VARCHAR | Place name |
| `category` | VARCHAR | cafe / viewpoint / trail / etc. |
| `location` | GEOMETRY(POINT, 4326) | PostGIS point |
| `region` | JSONB | SpotRegion: province / city / district / area |
| `tags` | TEXT[] | Tag array |
| `photos` | JSONB | SpotPhoto array (split into spot_photos table when auth is added) |
| `cover_asset_url` | VARCHAR NULL | Cover image URL |
| `way_ids` | TEXT[] | IDs of Ways this Spot belongs to |
| `contents` | JSONB | SpotContent array (split into spot_contents table when auth is added) |
| `related_ways` | JSONB | WayReference array |

Geographic filtering uses PostGIS `ST_Within(location, ST_MakeEnvelope(...))` replacing the manual bbox check in `mock_data.py`.

---

## Project Structure Changes

### New files

```
server/
  db/
    __init__.py
    engine.py          # SQLAlchemy async engine + AsyncSessionLocal factory
    models.py          # Way and Spot ORM models
  scripts/
    seed.py            # Import mock_data.py → database
  alembic/
    env.py
    versions/
      001_initial_schema.py
  alembic.ini
```

### Modified files

| File | Change |
|------|--------|
| `server/api/routes.py` | Replace mock_data dict lookups with async DB queries |
| `server/api/spots.py` | Replace mock_data dict lookups with async DB queries |
| `server/main.py` | Add lifespan handler to initialize DB connection pool |
| `server/requirements.txt` | Add sqlalchemy[asyncio], geoalchemy2, asyncpg, alembic, python-dotenv |

`server/services/mock_data.py` is kept as-is; the seed script imports from it directly.

### New dependencies

```
sqlalchemy[asyncio]>=2.0
geoalchemy2
asyncpg
alembic
python-dotenv
```

---

## API Query Logic

### GET /api/ways

**Before (mock):** Iterate `WAY_DETAILS` dict, hand-written rectangle check.

**After (DB):**
```sql
SELECT * FROM ways
WHERE ($bbox IS NULL OR ST_Within(preview_polyline, ST_MakeEnvelope(..., 4326)))
  AND ($theme IS NULL OR theme = $theme)
LIMIT $limit
```

### GET /api/ways/{way_id}

**After (DB):** `SELECT * FROM ways WHERE id = $way_id`

### GET /api/spots

**Before (mock):** Iterate `SPOTS` dict, hand-written coordinate check.

**After (DB):**
```sql
SELECT * FROM spots
WHERE ($bbox IS NULL OR ST_Within(location, ST_MakeEnvelope(..., 4326)))
LIMIT $limit
```

### GET /api/spots/{spot_id}

**After (DB):** `SELECT * FROM spots WHERE id = $spot_id`

---

## Session Injection (FastAPI Dependency)

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/api/ways")
async def list_ways(bbox: str | None = None, db: AsyncSession = Depends(get_db)):
    ...
```

Each request gets its own session, released automatically after the response.

---

## Error Handling

| Scenario | HTTP Status | Notes |
|----------|-------------|-------|
| Way / Spot not found | 404 | Consistent with current mock behavior |
| Invalid bbox format | 422 | FastAPI automatic (Pydantic validation) |
| DB connection failure | 503 | Explicit exception handler in main.py |

---

## Development Workflow

```bash
# One-time setup
pip install -r server/requirements.txt
alembic upgrade head
python -m server.scripts.seed

# Daily development
uvicorn server.main:app --reload
```

Environment variables required in `.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:ways123@localhost/ways
```

---

## Future Work (out of scope here)

- Add `users` table + JWT auth → then split `spots.contents` (JSONB) into a proper `spot_contents` table
- Add `spot_photos` table when Supabase Storage photo upload is implemented
- Docker Compose for local dev environment
- Deployment to Fly.io / Railway
