from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import AsyncSessionLocal, Base, engine
from app.api.v1 import router as v1_router
from app.seed_data import seed_database
from app.cache import close_cache

app = FastAPI(
    title="DuoLe AI Blog API",
    description="Backend API for DuoLe AI Blog, including auth, articles, projects, tags, search, and resume modules.",
    version="0.2.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
async def health_check():
    return {"code": 200, "message": "ok", "data": {"status": "healthy"}}


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session, settings)


@app.on_event("shutdown")
async def shutdown_event():
    await close_cache()
