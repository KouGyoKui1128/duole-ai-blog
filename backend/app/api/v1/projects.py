from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.auth import get_current_user, get_db
from app.cache import delete_pattern, get_json, set_json
from app.models.article import Project, User

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectPayload(BaseModel):
    title: str
    slug: str
    summary: str
    description: str
    tech_stack: list[str]
    repo_url: str
    demo_url: str | None = None
    cover_url: str | None = ""
    is_public: bool | None = None


def _can_manage_content(user: User, owner_id: int | None) -> bool:
    if user.role == "admin":
        return True
    if user.role == "editor" and owner_id == user.id:
        return True
    return False


def _can_review_content(user: User) -> bool:
    return user.role == "admin"


def _serialize_project(project: Project) -> dict:
    return {
        "id": project.id,
        "title": project.title,
        "slug": project.slug,
        "summary": project.summary,
        "description": project.description,
        "tech_stack": project.tech_stack.split(",") if project.tech_stack else [],
        "repo_url": project.repo_url,
        "demo_url": project.demo_url,
        "cover_url": project.cover_url,
        "is_public": project.is_public,
        "review_reason": project.review_reason,
        "reviewed_by": project.reviewed_by,
        "reviewed_at": project.reviewed_at,
        "created_by": project.created_by,
        "updated_by": project.updated_by,
    }


@router.get("")
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"duole:v1:projects:public:{page}:{page_size}"
    cached = await get_json(cache_key)
    if cached is not None:
        return {"code": 200, "message": "success", "data": cached}

    query = select(Project).where(Project.is_public == True)
    query = query.order_by(Project.id.asc())
    total = int((await db.scalar(select(func.count()).select_from(query.subquery()))) or 0)
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    projects = result.scalars().all()
    data = {
        "items": [_serialize_project(project) for project in projects],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size if total else 0,
    }
    await set_json(cache_key, data, ttl=300)
    return {
        "code": 200,
        "message": "success",
        "data": data,
    }


@router.get("/admin")
async def list_projects_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project)
    if current_user.role == "editor":
        query = query.where(Project.created_by == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    query = query.order_by(Project.id.asc())
    total = int((await db.scalar(select(func.count()).select_from(query.subquery()))) or 0)
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    projects = result.scalars().all()
    return {
        "code": 200,
        "message": "success",
        "data": {
            "items": [_serialize_project(project) for project in projects],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total else 0,
        },
    }


@router.get("/{slug}")
async def get_project(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.slug == slug, Project.is_public == True))
    project = result.scalar_one_or_none()
    if project is None:
        return {"code": 404, "message": "not found", "data": None}
    return {"code": 200, "message": "success", "data": _serialize_project(project)}


@router.post("")
async def create_project(
    payload: ProjectPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    existing = await db.execute(select(Project).where(Project.slug == payload.slug))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Slug already exists")

    project = Project(
        title=payload.title,
        slug=payload.slug,
        summary=payload.summary,
        description=payload.description,
        tech_stack=",".join(payload.tech_stack),
        repo_url=payload.repo_url,
        demo_url=payload.demo_url,
        cover_url=payload.cover_url,
        is_public=bool(payload.is_public) if payload.is_public is not None else False,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    await delete_pattern("duole:v1:projects:public:*")
    await delete_pattern("duole:v1:search:*")

    return {
        "code": 200,
        "message": "success",
        "data": _serialize_project(project),
    }


@router.put("/{project_id}")
async def update_project(
    project_id: int,
    payload: ProjectPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if not _can_manage_content(current_user, project.created_by):
        raise HTTPException(status_code=403, detail="Permission denied")

    project.title = payload.title
    project.slug = payload.slug
    project.summary = payload.summary
    project.description = payload.description
    project.tech_stack = ",".join(payload.tech_stack)
    project.repo_url = payload.repo_url
    project.demo_url = payload.demo_url
    project.cover_url = payload.cover_url
    if payload.is_public is not None:
        project.is_public = payload.is_public
        project.review_reason = None if payload.is_public else project.review_reason
    project.updated_by = current_user.id

    await db.commit()
    await db.refresh(project)
    await delete_pattern("duole:v1:projects:public:*")
    await delete_pattern("duole:v1:search:*")

    return {
        "code": 200,
        "message": "success",
        "data": _serialize_project(project),
    }


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if not _can_manage_content(current_user, project.created_by):
        raise HTTPException(status_code=403, detail="Permission denied")

    await db.delete(project)
    await db.commit()
    await delete_pattern("duole:v1:projects:public:*")
    await delete_pattern("duole:v1:search:*")
    return {"code": 200, "message": "success", "data": True}


class ProjectReviewPayload(BaseModel):
    is_public: bool
    review_reason: str | None = None


@router.post("/{project_id}/review")
async def review_project(
    project_id: int,
    payload: ProjectReviewPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_review_content(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_public = payload.is_public
    project.review_reason = payload.review_reason if not payload.is_public else None
    project.reviewed_by = current_user.id
    project.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    await delete_pattern("duole:v1:projects:public:*")
    await delete_pattern("duole:v1:search:*")

    return {"code": 200, "message": "success", "data": _serialize_project(project)}
