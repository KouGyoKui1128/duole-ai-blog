"""Tests run the real app against a throwaway Postgres database named *_test."""
import asyncio
import os
from pathlib import Path

import asyncpg
import pytest_asyncio
from dotenv import dotenv_values
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]
AUTHOR_EMAIL = "author@example.com"
AUTHOR_PASSWORD = "first-password-for-tests"


def _test_database_url() -> str:
    configured = os.environ.get("TEST_DATABASE_URL")
    if configured:
        return configured
    local_url = dotenv_values(BACKEND_DIR / ".env").get("DATABASE_URL")
    if not local_url:
        raise RuntimeError("Set TEST_DATABASE_URL or DATABASE_URL in backend/.env to run tests")
    url = make_url(local_url)
    return url.set(database=f"{url.database}_test").render_as_string(hide_password=False)


async def _ensure_database(url_text: str) -> None:
    url = make_url(url_text)
    if not url.database.endswith("_test"):
        raise RuntimeError("Refusing to run tests against a database not named *_test")
    connection = await asyncpg.connect(
        user=url.username, password=url.password, host=url.host, port=url.port, database="postgres"
    )
    try:
        exists = await connection.fetchval("select 1 from pg_database where datname = $1", url.database)
        if not exists:
            await connection.execute(f'create database "{url.database}"')
    finally:
        await connection.close()


TEST_DATABASE_URL = _test_database_url()
asyncio.run(_ensure_database(TEST_DATABASE_URL))

os.environ.update({
    "DATABASE_URL": TEST_DATABASE_URL,
    "SECRET_KEY": "test-secret-key-that-is-long-enough-for-config",
    "COOKIE_SECURE": "false",
    "AUTHOR_EMAIL": AUTHOR_EMAIL,
    "AUTHOR_PASSWORD": AUTHOR_PASSWORD,
    "SEED_DEMO_DATA": "false",
    "REDIS_URL": "",
})

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


async def _empty_database() -> None:
    async with engine.begin() as connection:
        await connection.execute(text("drop schema public cascade"))
        await connection.execute(text("create schema public"))


@pytest_asyncio.fixture
async def visitor():
    """A not-logged-in client on an app freshly started against an empty database."""
    await _empty_database()
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client
    await engine.dispose()


@pytest_asyncio.fixture
async def author(visitor):
    """The same app, with the client logged in as the Author."""
    response = await visitor.post("/api/v1/auth/login", json={"email": AUTHOR_EMAIL, "password": AUTHOR_PASSWORD})
    assert response.status_code == 200
    return visitor
