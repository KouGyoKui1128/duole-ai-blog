from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.article import Resume
import json

router = APIRouter(prefix="/resume", tags=["resume"])


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@router.get("")
async def get_resume(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resume).order_by(Resume.id.asc()))
    resume = result.scalars().first()
    if not resume:
        return {"code": 404, "message": "not found", "data": None}
    return {"code": 200, "message": "success", "data": {
        "id": resume.id,
        "name": resume.name,
        "title": resume.title,
        "bio": resume.bio,
        "email": resume.email,
        "github": resume.github,
        "website": resume.website,
        "skills": json.loads(resume.skills) if resume.skills else [],
        "experience": json.loads(resume.experience) if resume.experience else [],
        "education": json.loads(resume.education) if resume.education else [],
    }}
