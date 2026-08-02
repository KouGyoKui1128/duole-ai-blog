from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.auth import get_current_user, get_db
from app.models.article import Article, ArticleTag, Tag, User

router = APIRouter(prefix="/articles", tags=["articles"])


class ArticlePayload(BaseModel):
    title: str
    slug: str
    summary: str
    content: str
    published_at: str
    read_time: int
    tag_slugs: list[str] = []
    is_public: bool | None = None


def _can_manage_content(user: User, owner_id: int | None) -> bool:
    if user.role == "admin":
        return True
    if user.role == "editor" and owner_id == user.id:
        return True
    return False


def _can_review_content(user: User) -> bool:
    return user.role == "admin"


async def _serialize_article(db: AsyncSession, article: Article):
    tag_result = await db.execute(
        select(Tag).join(ArticleTag, Tag.id == ArticleTag.tag_id).where(ArticleTag.article_id == article.id)
    )
    tags = tag_result.scalars().all()
    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "summary": article.summary,
        "content": article.content,
        "published_at": article.published_at,
        "read_time": article.read_time,
        "is_public": article.is_public,
        "review_reason": article.review_reason,
        "reviewed_by": article.reviewed_by,
        "reviewed_at": article.reviewed_at,
        "created_by": article.created_by,
        "updated_by": article.updated_by,
        "tags": [{"name": tag.name, "slug": tag.slug, "color": tag.color} for tag in tags],
    }


@router.get("")
async def list_articles(db: AsyncSession = Depends(get_db)):
    query = select(Article).where(Article.is_public == True)
    query = query.order_by(Article.id.asc())
    result = await db.execute(query)
    articles = result.scalars().all()
    data = []
    for article in articles:
        data.append(await _serialize_article(db, article))
    return {"code": 200, "message": "success", "data": data}


@router.get("/admin")
async def list_articles_admin(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Article)
    if current_user.role == "editor":
        query = query.where(Article.created_by == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    query = query.order_by(Article.id.asc())
    result = await db.execute(query)
    articles = result.scalars().all()
    data = []
    for article in articles:
        data.append(await _serialize_article(db, article))
    return {"code": 200, "message": "success", "data": data}


@router.get("/{slug}")
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    query = select(Article).where(Article.slug == slug)
    query = query.where(Article.is_public == True)
    result = await db.execute(query)
    article = result.scalar_one_or_none()
    if not article:
        return {"code": 404, "message": "not found", "data": None}
    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.post("")
async def create_article(
    payload: ArticlePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    existing = await db.execute(select(Article).where(Article.slug == payload.slug))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Slug already exists")

    article = Article(
        title=payload.title,
        slug=payload.slug,
        summary=payload.summary,
        content=payload.content,
        published_at=payload.published_at,
        read_time=payload.read_time,
        is_public=bool(payload.is_public) if payload.is_public is not None else False,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(article)
    await db.flush()

    if payload.tag_slugs:
        tag_result = await db.execute(select(Tag).where(Tag.slug.in_(payload.tag_slugs)))
        tags = tag_result.scalars().all()
        for tag in tags:
            db.add(ArticleTag(article_id=article.id, tag_id=tag.id))

    await db.commit()
    await db.refresh(article)

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.put("/{article_id}")
async def update_article(
    article_id: int,
    payload: ArticlePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    if not _can_manage_content(current_user, article.created_by):
        raise HTTPException(status_code=403, detail="Permission denied")

    article.title = payload.title
    article.slug = payload.slug
    article.summary = payload.summary
    article.content = payload.content
    article.published_at = payload.published_at
    article.read_time = payload.read_time
    if payload.is_public is not None:
        article.is_public = payload.is_public
        article.review_reason = None if payload.is_public else article.review_reason
    article.updated_by = current_user.id

    await db.execute(ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id))
    if payload.tag_slugs:
        tag_result = await db.execute(select(Tag).where(Tag.slug.in_(payload.tag_slugs)))
        tags = tag_result.scalars().all()
        for tag in tags:
            db.add(ArticleTag(article_id=article.id, tag_id=tag.id))

    await db.commit()
    await db.refresh(article)

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


class ArticleReviewPayload(BaseModel):
    is_public: bool
    review_reason: str | None = None


@router.post("/{article_id}/review")
async def review_article(
    article_id: int,
    payload: ArticleReviewPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_review_content(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")

    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    article.is_public = payload.is_public
    article.review_reason = payload.review_reason if not payload.is_public else None
    article.reviewed_by = current_user.id
    article.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(article)

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.delete("/{article_id}")
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    if not _can_manage_content(current_user, article.created_by):
        raise HTTPException(status_code=403, detail="Permission denied")

    await db.execute(ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id))
    await db.delete(article)
    await db.commit()

    return {"code": 200, "message": "success", "data": True}
