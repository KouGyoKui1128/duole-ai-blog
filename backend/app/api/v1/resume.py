import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import get_current_user, get_db
from app.models.article import Resume, User

router = APIRouter(prefix="/resume", tags=["resume"])


class ResumePayload(BaseModel):
    name: str
    title: str
    bio: str
    email: str
    github: str
    website: str
    skills: list[dict]
    experience: list[dict]
    education: list[dict]


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


@router.put("")
async def update_resume(
    payload: ResumePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    result = await db.execute(select(Resume).order_by(Resume.id.asc()))
    resume = result.scalars().first()

    if resume is None:
        resume = Resume(
            name=payload.name,
            title=payload.title,
            bio=payload.bio,
            email=payload.email,
            github=payload.github,
            website=payload.website,
            skills=json.dumps(payload.skills, ensure_ascii=False),
            experience=json.dumps(payload.experience, ensure_ascii=False),
            education=json.dumps(payload.education, ensure_ascii=False),
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(resume)
    else:
        if current_user.role != "admin" and resume.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied")

        resume.name = payload.name
        resume.title = payload.title
        resume.bio = payload.bio
        resume.email = payload.email
        resume.github = payload.github
        resume.website = payload.website
        resume.skills = json.dumps(payload.skills, ensure_ascii=False)
        resume.experience = json.dumps(payload.experience, ensure_ascii=False)
        resume.education = json.dumps(payload.education, ensure_ascii=False)
        resume.updated_by = current_user.id

    await db.commit()
    await db.refresh(resume)

    return {
        "code": 200,
        "message": "success",
        "data": {
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
            "created_by": resume.created_by,
            "updated_by": resume.updated_by,
        },
    }
