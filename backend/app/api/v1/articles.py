from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.article import Article, Tag, ArticleTag

router = APIRouter(prefix="/articles", tags=["articles"])


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@router.get("")
async def list_articles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article).order_by(Article.id.asc()))
    articles = result.scalars().all()
    return {"code": 200, "message": "success", "data": [
        {
            "id": article.id,
            "title": article.title,
            "slug": article.slug,
            "summary": article.summary,
            "content": article.content,
            "published_at": article.published_at,
            "read_time": article.read_time,
            "tags": []
        }
        for article in articles
    ]}


@router.get("/{slug}")
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        return {"code": 404, "message": "not found", "data": None}
    return {"code": 200, "message": "success", "data": {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "summary": article.summary,
        "content": article.content,
        "published_at": article.published_at,
        "read_time": article.read_time,
        "tags": []
    }}
