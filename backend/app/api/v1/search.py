from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_db
from app.cache import get_json, set_json
from app.models.article import Article, Project

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_content(
    q: str = Query("", description="Search keyword"),
    scope: str = Query("all", pattern="^(all|articles|projects)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    keyword = q.strip()
    cache_key = f"duole:v1:search:{scope}:{page}:{page_size}:{keyword.lower()}"
    cached = await get_json(cache_key)
    if cached is not None:
        return {"code": 200, "message": "success", "data": cached}

    if not keyword:
        data = {
            "query": "",
            "scope": scope,
            "articles": [],
            "projects": [],
            "items": [],
            "page": page,
            "page_size": page_size,
            "total": 0,
            "total_pages": 0,
        }
        await set_json(cache_key, data, ttl=300)
        return {
            "code": 200,
            "message": "success",
            "data": data,
        }

    like = f"%{keyword}%"
    articles_data = []
    projects_data = []
    article_total = 0
    project_total = 0

    if scope in {"all", "articles"}:
        article_base = (
            select(Article)
            .where(
                Article.is_public == True,
                or_(
                    Article.title.ilike(like),
                    Article.summary.ilike(like),
                    Article.content.ilike(like),
                )
            )
            .order_by(Article.id.desc())
        )
        article_total = int((await db.scalar(select(func.count()).select_from(article_base.subquery()))) or 0)
        article_stmt = article_base.offset((page - 1) * page_size).limit(page_size)
        article_result = await db.execute(article_stmt)
        articles = article_result.scalars().all()
        articles_data = [
            {
                "id": article.id,
                "title": article.title,
                "slug": article.slug,
                "summary": article.summary,
                "published_at": article.published_at,
                "read_time": article.read_time,
            }
            for article in articles
        ]

    if scope in {"all", "projects"}:
        project_stmt = (
            select(Project)
            .where(
                Project.is_public == True,
                or_(
                    Project.title.ilike(like),
                    Project.summary.ilike(like),
                    Project.description.ilike(like),
                    Project.tech_stack.ilike(like),
                )
            )
            .order_by(Project.id.desc())
        )
        project_total = int((await db.scalar(select(func.count()).select_from(project_stmt.subquery()))) or 0)
        project_stmt = project_stmt.offset((page - 1) * page_size).limit(page_size)
        project_result = await db.execute(project_stmt)
        projects = project_result.scalars().all()
        projects_data = [
            {
                "id": project.id,
                "title": project.title,
                "slug": project.slug,
                "summary": project.summary,
                "tech_stack": project.tech_stack.split(",") if project.tech_stack else [],
            }
            for project in projects
        ]

    data = {
        "query": keyword,
        "scope": scope,
        "items": (articles_data + projects_data)[:page_size],
        "page": page,
        "page_size": page_size,
        "articles": articles_data,
        "projects": projects_data,
        "total": article_total + project_total,
        "total_pages": max(
            (article_total + page_size - 1) // page_size if article_total else 0,
            (project_total + page_size - 1) // page_size if project_total else 0,
        ),
    }
    await set_json(cache_key, data, ttl=300)
    return {
        "code": 200,
        "message": "success",
        "data": data,
    }
