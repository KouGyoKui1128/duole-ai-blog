from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, get_db
from app.cache import delete_pattern, get_json, set_json
from app.models.article import ArticleTag, Tag, User

router = APIRouter(prefix="/tags", tags=["tags"])


class TagPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    color: str = Field(min_length=1, max_length=50)


def _assert_tag_write_permission(user: User) -> None:
    if user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.get("")
async def list_tags(db: AsyncSession = Depends(get_db)):
    cache_key = "duole:v1:tags:public"
    cached = await get_json(cache_key)
    if cached is not None:
        return {"code": 200, "message": "success", "data": cached}

    result = await db.execute(select(Tag).order_by(Tag.id.asc()))
    tags = result.scalars().all()
    data = [
        {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "color": tag.color,
        }
        for tag in tags
    ]
    await set_json(cache_key, data, ttl=1800)
    return {
        "code": 200,
        "message": "success",
        "data": data,
    }


@router.post("")
async def create_tag(
    payload: TagPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_tag_write_permission(current_user)

    existing_name = await db.execute(select(Tag).where(Tag.name == payload.name))
    if existing_name.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Tag name already exists")

    existing_slug = await db.execute(select(Tag).where(Tag.slug == payload.slug))
    if existing_slug.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Tag slug already exists")

    tag = Tag(name=payload.name, slug=payload.slug, color=payload.color)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    await delete_pattern("duole:v1:tags:*")
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {
        "code": 200,
        "message": "success",
        "data": {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "color": tag.color,
        },
    }


@router.put("/{tag_id}")
async def update_tag(
    tag_id: int,
    payload: TagPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_tag_write_permission(current_user)

    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")

    conflict_name = await db.execute(select(Tag).where(Tag.name == payload.name, Tag.id != tag_id))
    if conflict_name.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Tag name already exists")

    conflict_slug = await db.execute(select(Tag).where(Tag.slug == payload.slug, Tag.id != tag_id))
    if conflict_slug.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Tag slug already exists")

    tag.name = payload.name
    tag.slug = payload.slug
    tag.color = payload.color
    await db.commit()
    await db.refresh(tag)
    await delete_pattern("duole:v1:tags:*")
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {
        "code": 200,
        "message": "success",
        "data": {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "color": tag.color,
        },
    }


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_tag_write_permission(current_user)

    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.execute(ArticleTag.__table__.delete().where(ArticleTag.tag_id == tag.id))
    await db.delete(tag)
    await db.commit()
    await delete_pattern("duole:v1:tags:*")
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": True}
