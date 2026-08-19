from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.auth import get_current_user
from app.models.article import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads" / "articles"


@router.post("/images")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image content type")

    now = datetime.utcnow()
    target_dir = UPLOAD_ROOT / now.strftime("%Y") / now.strftime("%m")
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    target_path = target_dir / filename
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file is not allowed")

    max_bytes = 5 * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail="Image size must be 5MB or less")

    target_path.write_bytes(contents)
    relative_path = f"/uploads/articles/{now.strftime('%Y')}/{now.strftime('%m')}/{filename}"
    url = str(request.base_url).rstrip("/") + relative_path

    return {
        "code": 200,
        "message": "success",
        "data": {
            "url": url,
            "path": relative_path,
            "filename": filename,
        },
    }
