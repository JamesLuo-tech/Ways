# Tracker Session Persistence Design

**Date:** 2026-05-14
**Scope:** Persist GPS track sessions recorded by the Tracker tab into PostgreSQL. Sessions are user-owned and independent of Ways/Spots.
**Approach:** Single `track_sessions` table — full GPS points in JSONB, simplified PostGIS LINESTRING for spatial queries, Haversine distance computed on save.

---

## Goals

- Authenticated users can save a completed TrackSession to the server
- Users can list their own past sessions (summary view)
- Users can retrieve a session's full detail (points + photo clusters)
- Users can delete their own sessions
- Non-owners cannot access or delete other users' sessions

## Non-Goals (deferred)

- Converting a session to a Way
- Sharing sessions publicly
- Streaming live GPS points (WebSocket)
- Server-side track simplification beyond basic downsampling

---

## Database Schema

### `track_sessions` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | String (PK) | UUID generated on save |
| `user_id` | String (FK → users.id) | Owner |
| `started_at` | DateTime(timezone=True) | Converted from client unix-ms timestamp |
| `ended_at` | DateTime(timezone=True) NULL | Null if session never ended |
| `track` | GEOMETRY(LINESTRING, 4326) NULL | Downsampled to ≤200 pts for map display |
| `points` | JSONB | Full TrackPoint array (lat, lng, alt, timestamp, speed, accuracy) |
| `photo_clusters` | JSONB | PhotoCluster array (id, coordinate, photos, representativePhoto) |
| `tags` | ARRAY(Text) | Review tags e.g. ["机位极佳", "人烟稀少"] |
| `distance_m` | Integer | Sum of Haversine distances between consecutive points |
| `duration_s` | Integer | (ended_at - started_at) in seconds |
| `created_at` | DateTime(timezone=True) | Server insertion time |

---

## API Endpoints

### POST /api/tracker/sessions (auth required)

Request body:
```json
{
  "startedAt": 1715000000000,
  "endedAt": 1715003600000,
  "points": [
    { "latitude": 30.262, "longitude": 120.108, "timestamp": 1715000000000, "altitude": 120.5, "speed": 1.2, "accuracy": 5.0 }
  ],
  "photoClusters": [
    {
      "id": "cluster-1",
      "coordinate": [120.108, 30.262],
      "photos": [{ "uri": "file://...", "latitude": 30.262, "longitude": 120.108, "timestamp": 1715000500000 }],
      "representativePhoto": { "uri": "file://...", "latitude": 30.262, "longitude": 120.108, "timestamp": 1715000500000 }
    }
  ],
  "tags": ["机位极佳"]
}
```

Response 201:
```json
{ "id": "uuid", "distanceM": 12400, "durationS": 3600 }
```

### GET /api/tracker/sessions (auth required)

Response 200:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "startedAt": 1715000000000,
      "endedAt": 1715003600000,
      "distanceM": 12400,
      "durationS": 3600,
      "tags": ["机位极佳"],
      "photoCount": 5,
      "createdAt": "2026-05-14T..."
    }
  ],
  "total": 1
}
```

### GET /api/tracker/sessions/{id} (auth required, owner only)

Response 200: SessionSummary + `points` array + `photoClusters` array.
Response 403 if not owner. Response 404 if not found.

### DELETE /api/tracker/sessions/{id} (auth required, owner only)

Response 204 on success. Response 403 if not owner. Response 404 if not found.

---

## Key Implementation Details

### Track LINESTRING (downsampling)
Take every `max(1, len(points) // 200)`-th point to produce ≤200 pts:
```python
step = max(1, len(points) // 200)
sampled = points[::step]
coords = ", ".join(f"{p['longitude']} {p['latitude']}" for p in sampled)
WKTElement(f"LINESTRING({coords})", srid=4326)
```
Returns None if fewer than 2 points.

### Distance (Haversine)
```python
import math
def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((phi2-phi1)/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(math.radians(lon2-lon1)/2)**2
    return 2*R*math.asin(math.sqrt(a))
```

### Timestamp conversion
`started_at = datetime.fromtimestamp(body.startedAt / 1000, tz=timezone.utc)`

---

## File Structure

**Create:**
- `server/api/tracker.py` — 4 route handlers
- `server/schemas/tracker.py` — request/response Pydantic models
- `server/alembic/versions/003_add_track_sessions.py` — migration
- `tests/test_tracker_api.py` — 7 tests

**Modify:**
- `server/db/models.py` — add TrackSession ORM model
- `server/main.py` — include tracker router

---

## Error Handling

| Scenario | Status |
|----------|--------|
| Not authenticated | 401 |
| Session not found | 404 |
| Session belongs to another user | 403 |
| Empty points array | 400 — "points must not be empty" |

---

## Testing

- POST with valid session → 201, check id + distanceM
- POST with 0 points → 400
- POST without auth → 401
- GET list → 200, sessions array, only current user's
- GET detail by id (owner) → 200, includes points
- GET detail by id (non-owner) → 403
- DELETE → 204, then GET returns 404
