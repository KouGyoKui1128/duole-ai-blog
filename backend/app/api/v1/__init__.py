from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.articles import router as articles_router
from app.api.v1.projects import router as projects_router
from app.api.v1.resume import router as resume_router
from app.api.v1.search import router as search_router
from app.api.v1.tags import router as tags_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(articles_router)
router.include_router(projects_router)
router.include_router(search_router)
router.include_router(tags_router)
router.include_router(resume_router)
