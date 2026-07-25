from fastapi import FastAPI
from app.database import AsyncSessionLocal, Base, engine
from app.api.v1 import router as v1_router
from app.seed_data import seed_database

app = FastAPI(title="DuoLe AI Blog API")

app.include_router(v1_router)


@app.get("/health")
async def health_check():
    return {"code": 200, "message": "ok", "data": {"status": "healthy"}}


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session)
