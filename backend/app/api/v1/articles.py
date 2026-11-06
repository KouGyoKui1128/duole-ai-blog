from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin, get_db
from app.cache import delete_pattern, get_json, set_json
from app.models.article import Article, ArticleTag, Tag, User

router = APIRouter(prefix="/articles", tags=["articles"])

Language = Literal["zh", "en"]


class ArticlePayload(BaseModel):
    title: str
    slug: str
    summary: str
    content: str
    published_at: str = ""
    read_time: int
    tag_slugs: list[str] = []
    is_public: bool | None = None
    language: Language | None = None

    @field_validator("published_at")
    @classmethod
    def normalize_published_at(cls, value: str) -> str:
        value = value.strip()
        if not value:
            return ""
        try:
            return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
        except ValueError as error:
            raise ValueError("published_at must look like 2026-01-31") from error


class PublishPayload(BaseModel):
    is_public: bool


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
        "language": article.language,
        "created_by": article.created_by,
        "updated_by": article.updated_by,
        "tags": [{"name": tag.name, "slug": tag.slug, "color": tag.color} for tag in tags],
    }


async def _serialize_articles(db: AsyncSession, articles: list[Article]) -> list[dict]:
    if not articles:
        return []

    article_ids = [article.id for article in articles]
    tag_result = await db.execute(
        select(ArticleTag.article_id, Tag)
        .join(Tag, Tag.id == ArticleTag.tag_id)
        .where(ArticleTag.article_id.in_(article_ids))
    )
    tags_by_article: dict[int, list[Tag]] = {article_id: [] for article_id in article_ids}
    for article_id, tag in tag_result.all():
        tags_by_article[article_id].append(tag)

    serialized = []
    for article in articles:
        serialized.append({
            "id": article.id,
            "title": article.title,
            "slug": article.slug,
            "summary": article.summary,
            "content": article.content,
            "published_at": article.published_at,
            "read_time": article.read_time,
            "is_public": article.is_public,
            "language": article.language,
            "created_by": article.created_by,
            "updated_by": article.updated_by,
            "tags": [
                {"name": tag.name, "slug": tag.slug, "color": tag.color}
                for tag in tags_by_article[article.id]
            ],
        })
    return serialized


def _paginated_response(items: list[dict], page: int, page_size: int, total: int) -> dict:
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size if total else 0,
    }


async def _list_articles(query, page: int, page_size: int, db: AsyncSession) -> dict:
    total = int((await db.scalar(select(func.count()).select_from(query.subquery()))) or 0)
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    articles = result.scalars().all()
    items = await _serialize_articles(db, articles)
    return _paginated_response(items, page, page_size, total)


def _date_if_published(article: Article) -> None:
    """An undated draft takes the day it goes live, so it sorts as new."""
    if article.is_public and not article.published_at:
        article.published_at = datetime.now(timezone.utc).date().isoformat()


def _newest_first(query):
    return query.order_by(Article.published_at.desc(), Article.id.desc())


@router.get("")
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    tag: str | None = Query(None, description="Only articles with this tag slug"),
    language: Language = Query("zh"),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"duole:v1:articles:public:{language}:{tag or ''}:{page}:{page_size}"
    cached = await get_json(cache_key)
    if cached is not None:
        return {"code": 200, "message": "success", "data": cached}

    query = select(Article).where(Article.is_public == True, Article.language == language)
    if tag:
        query = (
            query.join(ArticleTag, ArticleTag.article_id == Article.id)
            .join(Tag, Tag.id == ArticleTag.tag_id)
            .where(Tag.slug == tag)
        )
    data = await _list_articles(_newest_first(query), page, page_size, db)
    await set_json(cache_key, data, ttl=300)
    return {"code": 200, "message": "success", "data": data}


@router.get("/admin")
async def list_articles_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await _list_articles(_newest_first(select(Article)), page, page_size, db)
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


@router.get("/{slug}/related")
async def get_related_articles(
    slug: str,
    limit: int = Query(2, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    article = await db.scalar(select(Article).where(Article.slug == slug, Article.is_public == True))
    if article is None:
        return {"code": 404, "message": "not found", "data": []}

    tag_ids = (await db.scalars(select(ArticleTag.tag_id).where(ArticleTag.article_id == article.id))).all()
    shared_tags = (
        select(func.count())
        .select_from(ArticleTag)
        .where(ArticleTag.article_id == Article.id, ArticleTag.tag_id.in_(tag_ids))
        .scalar_subquery()
    )
    result = await db.execute(
        select(Article)
        .where(
            Article.is_public == True,
            Article.language == article.language,
            Article.id != article.id,
            shared_tags > 0,
        )
        .order_by(shared_tags.desc(), Article.published_at.desc(), Article.id.desc())
        .limit(limit)
    )
    return {"code": 200, "message": "success", "data": await _serialize_articles(db, result.scalars().all())}


@router.post("")
async def create_article(
    payload: ArticlePayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
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
        language=payload.language or "zh",
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    _date_if_published(article)
    db.add(article)
    await db.flush()

    if payload.tag_slugs:
        tag_result = await db.execute(select(Tag).where(Tag.slug.in_(payload.tag_slugs)))
        tags = tag_result.scalars().all()
        for tag in tags:
            db.add(ArticleTag(article_id=article.id, tag_id=tag.id))

    await db.commit()
    await db.refresh(article)
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.put("/{article_id}")
async def update_article(
    article_id: int,
    payload: ArticlePayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    article.title = payload.title
    article.slug = payload.slug
    article.summary = payload.summary
    article.content = payload.content
    article.published_at = payload.published_at
    article.read_time = payload.read_time
    if payload.is_public is not None:
        article.is_public = payload.is_public
    if payload.language is not None:
        article.language = payload.language
    _date_if_published(article)
    article.updated_by = current_user.id

    await db.execute(ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id))
    if payload.tag_slugs:
        tag_result = await db.execute(select(Tag).where(Tag.slug.in_(payload.tag_slugs)))
        tags = tag_result.scalars().all()
        for tag in tags:
            db.add(ArticleTag(article_id=article.id, tag_id=tag.id))

    await db.commit()
    await db.refresh(article)
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.post("/{article_id}/publish")
async def set_article_published(
    article_id: int,
    payload: PublishPayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    article.is_public = payload.is_public
    _date_if_published(article)
    article.updated_by = current_user.id
    await db.commit()
    await db.refresh(article)
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": await _serialize_article(db, article)}


@router.delete("/{article_id}")
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    await db.execute(ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id))
    await db.delete(article)
    await db.commit()
    await delete_pattern("duole:v1:articles:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": True}
