from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_db
from app.models.article import Article, Project

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_content(
    q: str = Query("", description="Search keyword"),
    scope: str = Query("all", pattern="^(all|articles|projects)$"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    keyword = q.strip()
    if not keyword:
        return {
            "code": 200,
            "message": "success",
            "data": {
                "query": "",
                "scope": scope,
                "articles": [],
                "projects": [],
                "total": 0,
            },
        }

    like = f"%{keyword}%"
    articles_data = []
    projects_data = []

    if scope in {"all", "articles"}:
        article_stmt = (
            select(Article)
            .where(
                or_(
                    Article.title.ilike(like),
                    Article.summary.ilike(like),
                    Article.content.ilike(like),
                )
            )
            .order_by(Article.id.desc())
            .limit(limit)
        )
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
                or_(
                    Project.title.ilike(like),
                    Project.summary.ilike(like),
                    Project.description.ilike(like),
                    Project.tech_stack.ilike(like),
                )
            )
            .order_by(Project.id.desc())
            .limit(limit)
        )
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

    return {
        "code": 200,
        "message": "success",
        "data": {
            "query": keyword,
            "scope": scope,
            "articles": articles_data,
            "projects": projects_data,
            "total": len(articles_data) + len(projects_data),
        },
    }
