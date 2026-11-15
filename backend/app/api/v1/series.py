"""Series: a reading order the Author sets for published articles in one language."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin, get_db
from app.models.article import Article, Series, User
from app.slugs import SLUG_PATTERN, SLUG_RULE

router = APIRouter(prefix="/series", tags=["series"])

Language = Literal["zh", "en"]
LANGUAGE_NAMES = {"zh": "中文", "en": "English"}


class SeriesPayload(BaseModel):
    title: str
    slug: str
    summary: str = ""
    language: Language = "zh"
    sort: int = 0

    @field_validator("title")
    @classmethod
    def require_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("合集标题不能为空")
        return value

    @field_validator("slug")
    @classmethod
    def check_slug(cls, value: str) -> str:
        value = value.strip()
        if not SLUG_PATTERN.fullmatch(value):
            raise ValueError(SLUG_RULE)
        return value


def reading_order():
    """Numbered articles first, by number; ties and unnumbered ones fall back to date."""
    return (Article.series_order.asc().nulls_last(), Article.published_at.asc(), Article.id.asc())


def _serialize_series(series: Series, article_count: int) -> dict:
    return {
        "id": series.id,
        "title": series.title,
        "slug": series.slug,
        "summary": series.summary,
        "language": series.language,
        "sort": series.sort,
        "article_count": article_count,
    }


async def _list_with_counts(db: AsyncSession, *, published_only: bool, language: str | None = None) -> list[dict]:
    counted = select(Article.series_id, func.count().label("n")).where(Article.series_id.is_not(None))
    if published_only:
        counted = counted.where(Article.is_public == True)
    counts = counted.group_by(Article.series_id).subquery()

    query = (
        select(Series, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.series_id == Series.id)
        .order_by(Series.sort.asc(), Series.id.asc())
    )
    if published_only:
        query = query.where(counts.c.n > 0)
    if language:
        query = query.where(Series.language == language)
    rows = (await db.execute(query)).all()
    return [_serialize_series(series, int(count)) for series, count in rows]


async def _slug_taken(db: AsyncSession, slug: str, *, except_id: int | None = None) -> bool:
    query = select(Series.id).where(Series.slug == slug)
    if except_id is not None:
        query = query.where(Series.id != except_id)
    return (await db.scalar(query)) is not None


def language_mismatch(series: Series) -> HTTPException:
    return HTTPException(
        status_code=422,
        detail=f"合集《{series.title}》只收{LANGUAGE_NAMES[series.language]}文章，文章语言要和合集一致",
    )


async def next_order(db: AsyncSession, series_id: int, *, except_article_id: int | None = None) -> int:
    query = select(func.max(Article.series_order)).where(Article.series_id == series_id)
    if except_article_id is not None:
        query = query.where(Article.id != except_article_id)
    return int((await db.scalar(query)) or 0) + 1


async def series_context(db: AsyncSession, article: Article) -> dict | None:
    """Where a published article sits in its series, for the 第 n/N 篇 line and previous/next links."""
    if article.series_id is None:
        return None
    series = await db.get(Series, article.series_id)
    if series is None:
        return None
    rows = (
        await db.execute(
            select(Article.id, Article.title, Article.slug)
            .where(Article.series_id == series.id, Article.is_public == True)
            .order_by(*reading_order())
        )
    ).all()
    ids = [row.id for row in rows]
    if article.id not in ids:
        return None

    index = ids.index(article.id)
    link = lambda row: {"title": row.title, "slug": row.slug}  # noqa: E731
    return {
        "title": series.title,
        "slug": series.slug,
        "position": index + 1,
        "total": len(rows),
        "previous": link(rows[index - 1]) if index > 0 else None,
        "next": link(rows[index + 1]) if index + 1 < len(rows) else None,
    }


@router.get("")
async def list_series(language: Language | None = Query(None), db: AsyncSession = Depends(get_db)):
    data = await _list_with_counts(db, published_only=True, language=language)
    return {"code": 200, "message": "success", "data": data}


@router.get("/admin")
async def list_series_admin(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    return {"code": 200, "message": "success", "data": await _list_with_counts(db, published_only=False)}


@router.get("/{slug}")
async def get_series(slug: str, db: AsyncSession = Depends(get_db)):
    series = await db.scalar(select(Series).where(Series.slug == slug))
    if series is None:
        return {"code": 404, "message": "not found", "data": None}
    articles = (
        await db.scalars(
            select(Article).where(Article.series_id == series.id, Article.is_public == True).order_by(*reading_order())
        )
    ).all()
    if not articles:
        return {"code": 404, "message": "not found", "data": None}

    data = _serialize_series(series, len(articles))
    data["articles"] = [
        {
            "id": article.id,
            "title": article.title,
            "slug": article.slug,
            "summary": article.summary,
            "published_at": article.published_at,
            "read_time": article.read_time,
            "language": article.language,
            "series_order": article.series_order,
        }
        for article in articles
    ]
    return {"code": 200, "message": "success", "data": data}


@router.post("")
async def create_series(
    payload: SeriesPayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if await _slug_taken(db, payload.slug):
        raise HTTPException(status_code=409, detail="这个 slug 已被占用，请换一个")
    series = Series(**payload.model_dump())
    db.add(series)
    await db.commit()
    await db.refresh(series)
    return {"code": 200, "message": "success", "data": _serialize_series(series, 0)}


@router.put("/{series_id}")
async def update_series(
    series_id: int,
    payload: SeriesPayload,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    series = await db.get(Series, series_id)
    if series is None:
        raise HTTPException(status_code=404, detail="Series not found")
    if await _slug_taken(db, payload.slug, except_id=series.id):
        raise HTTPException(status_code=409, detail="这个 slug 已被占用，请换一个")
    other_language = await db.scalar(
        select(func.count()).where(Article.series_id == series.id, Article.language != payload.language)
    )
    if other_language:
        raise HTTPException(status_code=422, detail="合集里还有其他语言的文章，先把它们移出合集再改语言")

    for key, value in payload.model_dump().items():
        setattr(series, key, value)
    await db.commit()
    await db.refresh(series)
    count = int(await db.scalar(select(func.count()).where(Article.series_id == series.id)) or 0)
    return {"code": 200, "message": "success", "data": _serialize_series(series, count)}


@router.delete("/{series_id}")
async def delete_series(
    series_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """The articles stay; they just leave the series."""
    series = await db.get(Series, series_id)
    if series is None:
        raise HTTPException(status_code=404, detail="Series not found")
    await db.execute(
        update(Article).where(Article.series_id == series.id).values(series_id=None, series_order=None)
    )
    await db.delete(series)
    await db.commit()
    return {"code": 200, "message": "success", "data": True}
