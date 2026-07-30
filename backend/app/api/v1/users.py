from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin, get_db, hash_password
from app.models.article import User

router = APIRouter(prefix="/users", tags=["users"])

VALID_ROLES = {"admin", "editor", "viewer"}


class UserCreatePayload(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "viewer"


class UserUpdatePayload(BaseModel):
    username: str | None = None
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None


@router.get("")
async def list_users(_: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.id.asc()))
    users = result.scalars().all()
    return {
        "code": 200,
        "message": "success",
        "data": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
            for user in users
        ],
    }


@router.post("")
async def create_user(payload: UserCreatePayload, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already exists")

    existing_username = await db.execute(select(User).where(User.username == payload.username))
    if existing_username.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "code": 200,
        "message": "success",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }


@router.put("/{user_id}")
async def update_user(user_id: int, payload: UserUpdatePayload, admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        if payload.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = payload.role

    if payload.username is not None and payload.username.strip() != "":
        user.username = payload.username.strip()

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.password is not None and payload.password.strip() != "":
        user.password_hash = hash_password(payload.password)

    if admin.id == user.id and user.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot demote yourself from admin")

    await db.commit()
    await db.refresh(user)

    return {
        "code": 200,
        "message": "success",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }


@router.delete("/{user_id}")
async def delete_user(user_id: int, admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

    return {"code": 200, "message": "success", "data": True}
