# Content Creation API Design

**Date:** 2026-05-14
**Scope:** CRUD write endpoints for Ways and Spots. Add owner_id to both tables; owner-only mutation.
**Approach:** Add owner_id (nullable) to ways and spots via migration. POST creates with owner=current_user. PATCH does partial update (owner only). DELETE is owner-only. Existing seed data (owner_id=null) is read-only.

---

## Goals

- Authenticated users can create Ways and Spots
- Only the owner can update or delete their own resources
- Existing seed data (owner_id null) is protected from mutation by any user
- PATCH accepts partial fields — only provided fields are updated

## Non-Goals

- Bulk operations
- Soft delete / archive
- Admin override for null-owner data

---

## Database Changes

### Migration 004: add owner_id

Add `owner_id VARCHAR NULL` to both `ways` and `spots` tables. No FK constraint (avoids cascade complexity). Existing rows keep `owner_id = NULL`.

---

## API Endpoints

### POST /api/ways (auth required)

Request:
```json
{
  "name": "莫干山精酿之路",
  "theme": "wine",
  "previewPolyline": [[120.108, 30.262], [120.122, 30.271]],
  "coverPhoto": "https://...",
  "heatBucket": "emerging",
  "spotCount": 0,
  "distance": 0,
  "duration": 0,
  "contentCount": 0,
  "savedCountLabel": "0",
  "spots": []
}
```
Required: `name`, `theme`, `previewPolyline`
Optional (defaults): `coverPhoto=""`, `heatBucket="emerging"`, `spotCount=0`, `distance=0`, `duration=0`, `contentCount=0`, `savedCountLabel="0"`, `spots=[]`

Response 201: WayDetail (same schema as GET /api/ways/{id})

### PATCH /api/ways/{id} (auth, owner only)

Request (all fields optional):
```json
{ "name": "新名称", "heatBucket": "hot" }
```

Response 200: WayDetail

Errors: 404 if not found, 403 if owner_id != current_user.id OR owner_id is null

### DELETE /api/ways/{id} (auth, owner only)

Response 204. Errors: 404, 403 (same rules as PATCH)

### POST /api/spots (auth required)

Request:
```json
{
  "name": "青芝坞入口",
  "category": "scenic",
  "coordinate": [120.108, 30.262],
  "region": {"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山"},
  "tags": ["机位极佳"],
  "photos": [],
  "wayIds": [],
  "contents": [],
  "relatedWays": []
}
```
Required: `name`, `category`, `coordinate`
Optional (defaults): `region=null`, `tags=[]`, `photos=[]`, `wayIds=[]`, `contents=[]`, `relatedWays=[]`

Response 201: SpotDetail (same schema as GET /api/spots/{id})

### PATCH /api/spots/{id} (auth, owner only)

All fields optional. Response 200: SpotDetail.
Errors: 404, 403

### DELETE /api/spots/{id} (auth, owner only)

Response 204. Errors: 404, 403

---

## File Structure

**Create:**
- `server/schemas/content.py` — CreateWayRequest, PatchWayRequest, CreateSpotRequest, PatchSpotRequest
- `server/alembic/versions/004_add_owner_id.py` — adds owner_id to ways and spots
- `tests/test_content_api.py` — 10 tests

**Modify:**
- `server/db/models.py` — add owner_id to Way and Spot
- `server/api/routes.py` — add POST, PATCH, DELETE handlers
- `server/api/spots.py` — add POST, PATCH, DELETE handlers

---

## Error Handling

| Scenario | Status |
|----------|--------|
| Not authenticated | 401 |
| Resource not found | 404 |
| owner_id null (seed data) | 403 |
| owner_id != current_user | 403 |
| Missing required field | 422 (Pydantic) |

---

## Testing

- POST /api/ways → 201, returns WayDetail with correct fields + owner
- POST /api/spots → 201, returns SpotDetail
- POST without auth → 401
- PATCH /api/ways/{id} own way → 200, fields updated
- PATCH /api/ways/{id} other user's way → 403
- PATCH seed-data way (owner_id null) → 403
- DELETE own way → 204, then GET returns 404
- DELETE other user's way → 403
- DELETE spot → 204
- PATCH spot partial fields → 200, only changed fields updated
