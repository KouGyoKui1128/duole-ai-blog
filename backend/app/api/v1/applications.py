from datetime import datetime, timezone
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin, get_db, hash_password
from app.models.article import UserApplication, User

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationPayload(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_\-]+$")
    email: EmailStr
    requested_role: str = "editor"
    motivation: str = Field(min_length=10, max_length=500)


class ApplicationReviewPayload(BaseModel):
    status: str
    review_note: str | None = None


def _status_label(status: str) -> str:
    if status == "pending":
        return "审核中"
    if status == "approved":
        return "已完成审核"
    if status == "rejected":
        return "拒绝申请"
    return status


def _generate_initial_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _serialize_application(application: UserApplication) -> dict:
    return {
        "id": application.id,
        "username": application.username,
        "email": application.email,
        "requested_role": application.requested_role,
        "motivation": application.motivation,
        "status": application.status,
        "status_label": _status_label(application.status),
        "initial_password": application.initial_password,
        "review_note": application.review_note,
        "reviewed_by": application.reviewed_by,
        "reviewed_at": application.reviewed_at,
        "created_user_id": application.created_user_id,
        "created_at": application.created_at,
    }


@router.get("/status")
async def query_application_status(email: EmailStr = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserApplication)
        .where(UserApplication.email == email)
        .order_by(UserApplication.id.desc())
    )
    application = result.scalars().first()
    if application is None:
        return {"code": 200, "message": "no application", "data": None}

    data = _serialize_application(application)
    if application.status != "approved":
        data["initial_password"] = None

    return {"code": 200, "message": "success", "data": data}


@router.post("")
async def create_application(payload: ApplicationPayload, db: AsyncSession = Depends(get_db)):
    if payload.requested_role != "editor":
        raise HTTPException(status_code=400, detail="Only editor applications are supported")

    existing_user_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_user_email.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")

    existing_user_username = await db.execute(select(User).where(User.username == payload.username))
    if existing_user_username.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Username is already registered")

    existing_pending = await db.execute(
        select(UserApplication).where(
            UserApplication.email == payload.email,
            UserApplication.status == "pending",
        )
    )
    if existing_pending.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="You already have a pending application")

    application = UserApplication(
        username=payload.username,
        email=payload.email,
        requested_role=payload.requested_role,
        motivation=payload.motivation,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return {"code": 200, "message": "success", "data": _serialize_application(application)}


@router.get("")
async def list_applications(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserApplication).order_by(UserApplication.id.desc()))
    applications = result.scalars().all()
    return {"code": 200, "message": "success", "data": [_serialize_application(application) for application in applications]}


@router.post("/{application_id}/review")
async def review_application(
    application_id: int,
    payload: ApplicationReviewPayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.status not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.execute(select(UserApplication).where(UserApplication.id == application_id))
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status == "approved" and application.created_user_id is not None and payload.status == "rejected":
        raise HTTPException(status_code=400, detail="Approved application cannot be rejected")

    if payload.status == "approved":
        if application.created_user_id is None:
            existing_email = await db.execute(select(User).where(User.email == application.email))
            if existing_email.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Cannot approve: email already registered")

            existing_username = await db.execute(select(User).where(User.username == application.username))
            if existing_username.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Cannot approve: username already registered")

            initial_password = _generate_initial_password()
            user = User(
                username=application.username,
                email=application.email,
                password_hash=hash_password(initial_password),
                role="editor",
                is_active=True,
            )
            db.add(user)
            await db.flush()

            application.created_user_id = user.id
            application.initial_password = initial_password

    application.status = payload.status
    application.review_note = payload.review_note
    application.reviewed_by = current_user.id
    application.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(application)

    return {"code": 200, "message": "success", "data": _serialize_application(application)}