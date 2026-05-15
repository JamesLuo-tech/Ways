# Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `POST /api/upload/photo` endpoint that accepts a multipart image file and returns a public Supabase Storage URL.

**Architecture:** FastAPI multipart handler validates file type (jpeg/png/webp) and size (≤10MB), uploads to Supabase `photos` bucket using the service_role key, and returns the public URL. The sync supabase client is used directly in the async handler (acceptable for MVP). Tests mock `server.api.upload.supabase_client` to avoid real network calls.

**Tech Stack:** FastAPI, supabase-py>=2.0, python-multipart, pytest-asyncio, unittest.mock

---

## File Map

**Create:**
- `server/schemas/upload.py` — UploadResponse (url: str)
- `server/api/upload.py` — upload route + supabase client singleton
- `tests/test_upload_api.py` — 3 tests

**Modify:**
- `server/requirements.txt` — add supabase>=2.0 and python-multipart>=0.0.9
- `server/main.py` — include upload router

---

## Task 1: Add dependencies

**Files:**
- Modify: `server/requirements.txt`

- [ ] **Step 1: Add two lines to `server/requirements.txt`**

Append after the existing content:
```
supabase>=2.0
python-multipart>=0.0.9
```

- [ ] **Step 2: Install**

```bash
pip install "supabase>=2.0" "python-multipart>=0.0.9"
```

Expected: No errors.

- [ ] **Step 3: Verify**

```bash
python -c "import supabase; import multipart; print('OK')"
```

Expected: `OK`

---

## Task 2: Create schemas and upload route

**Files:**
- Create: `server/schemas/upload.py`
- Create: `server/api/upload.py`

- [ ] **Step 1: Create `server/schemas/upload.py`**

```python
from pydantic import BaseModel


class UploadResponse(BaseModel):
    url: str
```

- [ ] **Step 2: Create `server/api/upload.py`**

```python
import os
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import create_client, Client

from server.db.models import User
from server.dependencies import get_current_user
from server.schemas.upload import UploadResponse

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BUCKET = "photos"

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/photo", response_model=UploadResponse, status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: jpeg, png, webp",
        )

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB",
        )

    ext = EXTENSIONS[file.content_type]
    path = f"{current_user.id}/{uuid.uuid4().hex}.{ext}"

    supabase_client.storage.from_(BUCKET).upload(
        path=path,
        file=content,
        file_options={"content-type": file.content_type},
    )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    return UploadResponse(url=public_url)
```

- [ ] **Step 3: Verify imports**

```bash
python -c "from server.api.upload import router, supabase_client; print('OK')"
```

Expected: `OK`

---

## Task 3: Write tests

**Files:**
- Create: `tests/test_upload_api.py`

- [ ] **Step 1: Create `tests/test_upload_api.py`**

```python
import uuid
import pytest
from unittest.mock import MagicMock, patch

pytestmark = pytest.mark.asyncio


async def _register(client) -> str:
    email = f"upload-{uuid.uuid4().hex[:8]}@example.com"
    resp = await client.post("/api/auth/register", json={
        "email": email, "password": "pass", "displayName": "Upload User",
    })
    return resp.json()["accessToken"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def test_upload_without_auth_returns_401(client):
    response = await client.post(
        "/api/upload/photo",
        files={"file": ("test.jpg", b"fake", "image/jpeg")},
    )
    assert response.status_code == 401


async def test_upload_wrong_type_returns_400(client):
    token = await _register(client)
    response = await client.post(
        "/api/upload/photo",
        files={"file": ("test.txt", b"hello", "text/plain")},
        headers=_auth(token),
    )
    assert response.status_code == 400
    assert "Unsupported" in response.json()["detail"]


async def test_upload_jpeg_returns_public_url(client):
    token = await _register(client)
    fake_bytes = b"\xff\xd8\xff" + b"0" * 100
    with patch("server.api.upload.supabase_client") as mock_sb:
        mock_sb.storage.from_.return_value.upload.return_value = MagicMock()
        response = await client.post(
            "/api/upload/photo",
            files={"file": ("photo.jpg", fake_bytes, "image/jpeg")},
            headers=_auth(token),
        )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert "egymcznixppmsapnvoni.supabase.co" in data["url"]
    assert data["url"].endswith(".jpg")
```

- [ ] **Step 2: Run tests — expect all 3 to FAIL**

```bash
pytest tests/test_upload_api.py -v
```

Expected: All 3 FAIL with 404 or 405 (upload router not wired yet).

---

## Task 4: Wire router, run all tests, commit, update wiki

**Files:**
- Modify: `server/main.py`
- Modify: `wiki/02-system-architecture.md`

- [ ] **Step 1: Replace `server/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from server.api.auth import router as auth_router
from server.api.routes import router as ways_router
from server.api.spots import router as spots_router
from server.api.tracker import router as tracker_router
from server.api.upload import router as upload_router
from server.db.engine import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(title="Ways API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ways_router)
app.include_router(spots_router)
app.include_router(tracker_router)
app.include_router(upload_router)


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 2: Run all tests**

```bash
pytest tests/ -v
```

Expected: All 38 tests PASS (35 existing + 3 new upload tests).

- [ ] **Step 3: Commit**

```bash
git add server/requirements.txt server/schemas/upload.py server/api/upload.py server/main.py tests/test_upload_api.py
git commit -m "feat: add photo upload to Supabase Storage"
```

- [ ] **Step 4: Update wiki**

In `wiki/02-system-architecture.md`, add to the API routes section:
```
POST /api/upload/photo  — 上传图片到 Supabase Storage，返回公开 URL（需 auth）
```

Add to environment variables section:
```
SUPABASE_URL         — Supabase 项目 URL
SUPABASE_SERVICE_KEY — Supabase service_role key（服务端上传用）
```

- [ ] **Step 5: Commit wiki**

```bash
git add wiki/02-system-architecture.md
git commit -m "docs: update wiki with photo upload endpoint and Supabase env vars"
```
