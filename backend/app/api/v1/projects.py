from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.article import Project

router = APIRouter(prefix="/projects", tags=["projects"])


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.id.asc()))
    projects = result.scalars().all()
    return {"code": 200, "message": "success", "data": [
        {
            "id": project.id,
            "title": project.title,
            "slug": project.slug,
            "summary": project.summary,
            "description": project.description,
            "tech_stack": project.tech_stack.split(",") if project.tech_stack else [],
            "repo_url": project.repo_url,
            "demo_url": project.demo_url,
            "cover_url": project.cover_url,
        }
        for project in projects
    ]}
