from dataclasses import replace

import pytest

from app import main
from app.main import app
from tests.conftest import AUTHOR_EMAIL, AUTHOR_PASSWORD

LOGIN = "/api/v1/auth/login"


async def test_empty_database_starts_with_no_demo_content(visitor):
    assert (await visitor.get("/api/v1/articles")).json()["data"]["items"] == []
    assert (await visitor.get("/api/v1/projects")).json()["data"]["items"] == []
    assert (await visitor.get("/api/v1/tags")).json()["data"] == []
    assert (await visitor.get("/api/v1/resume")).json()["data"] is None


async def test_author_is_created_from_the_environment(visitor):
    response = await visitor.post(LOGIN, json={"email": AUTHOR_EMAIL, "password": AUTHOR_PASSWORD})
    assert response.status_code == 200


async def test_restart_keeps_a_changed_password(author):
    new_password = "a-new-password-for-tests"
    changed = await author.post(
        "/api/v1/auth/change-password",
        json={"current_password": AUTHOR_PASSWORD, "new_password": new_password},
    )
    assert changed.status_code == 200

    async with app.router.lifespan_context(app):
        old = await author.post(LOGIN, json={"email": AUTHOR_EMAIL, "password": AUTHOR_PASSWORD})
        new = await author.post(LOGIN, json={"email": AUTHOR_EMAIL, "password": new_password})

    assert old.status_code == 401
    assert new.status_code == 200


async def test_empty_database_without_author_credentials_refuses_to_start(visitor, monkeypatch):
    from sqlalchemy import text

    from app.database import engine

    async with engine.begin() as connection:
        await connection.execute(text("delete from users"))
    monkeypatch.setattr(main, "settings", replace(main.settings, author_password=""))

    with pytest.raises(RuntimeError, match="AUTHOR_PASSWORD"):
        async with app.router.lifespan_context(app):
            pass
