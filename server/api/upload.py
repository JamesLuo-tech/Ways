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
