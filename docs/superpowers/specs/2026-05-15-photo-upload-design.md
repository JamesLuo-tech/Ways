# Photo Upload Design

**Date:** 2026-05-15
**Scope:** Single endpoint to upload photos to Supabase Storage. Returns a public URL usable in Spot photos, Way cover photos, and Tracker session photo clusters.
**Approach:** FastAPI multipart upload → validate type/size → upload to Supabase `photos` bucket using service_role key → return public URL.

---

## Goals

- Authenticated users can upload a photo and get back a public URL
- The URL can be stored in any JSONB field (spot.photos, way.cover_photo, track_session.photo_clusters)
- Validation rejects non-image files and files over 10MB
- Tests use mocked Supabase client (no real network calls)

## Non-Goals

- Resizing or thumbnail generation
- Deleting photos from storage
- Per-user storage quotas
- Associating a photo with a specific resource at upload time (caller stores the URL wherever needed)

---

## API Endpoint

### POST /api/upload/photo (auth required)

Request: `multipart/form-data` with field `file` (image file)

Response 201:
```json
{ "url": "https://egymcznixppmsapnvoni.supabase.co/storage/v1/object/public/photos/user_id/uuid.jpg" }
```

Errors:
- 401 — not authenticated
- 400 — unsupported file type (only jpeg/png/webp accepted)
- 400 — file too large (>10MB)

---

## Implementation Details

### Supabase client initialization

```python
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET = "photos"

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

### Upload path

```
{user_id}/{uuid4_hex}.{ext}
```

e.g. `a1b2c3d4.../f8e7d6c5b4a3.jpg`

### Public URL construction

```python
f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
```

### File validation

```python
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
```

---

## File Structure

**Create:**
- `server/schemas/upload.py` — UploadResponse (url: str)
- `server/api/upload.py` — POST /api/upload/photo handler + supabase_client singleton
- `tests/test_upload_api.py` — 3 tests (auth, wrong type, success with mock)

**Modify:**
- `server/requirements.txt` — add supabase>=2.0
- `server/main.py` — include upload router

---

## Testing Strategy

Tests mock `server.api.upload.supabase_client` so no real Supabase network calls are made:

1. No auth → 401
2. Wrong file type (text/plain) → 400
3. Valid jpeg + mocked supabase → 201 + url in response

---

## Environment Variables

`.env` additions (already added):
```
SUPABASE_URL=https://egymcznixppmsapnvoni.supabase.co
SUPABASE_SERVICE_KEY=eyJ...service_role_key...
```
