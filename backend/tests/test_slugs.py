import re
from datetime import datetime, timezone

import pytest
from sqlalchemy import text

from app.database import engine
from app.main import app
from tests.test_content import ARTICLES, MINIMAL_ARTICLE, make_article


def today_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d")


async def test_blank_slug_is_generated_from_today(author):
    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": "  "})

    assert response.status_code == 200, response.text
    assert re.fullmatch(rf"post-{today_compact()}-[0-9a-f]{{4}}", response.json()["data"]["slug"])


async def test_generated_slug_skips_one_already_in_use(author, monkeypatch):
    taken = f"post-{today_compact()}-aaaa"
    await make_article(author, taken)
    candidates = iter(["aaaa", "aaaa", "bbbb"])
    monkeypatch.setattr("app.slugs.secrets.token_hex", lambda _: next(candidates))

    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": ""})

    assert response.json()["data"]["slug"] == f"post-{today_compact()}-bbbb"


async def test_two_articles_with_blank_slugs_get_different_slugs(author):
    first = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": ""})
    second = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": ""})

    assert first.json()["data"]["slug"] != second.json()["data"]["slug"]


async def test_slug_is_trimmed(author):
    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": "  langgraph-notes "})

    assert response.json()["data"]["slug"] == "langgraph-notes"


@pytest.mark.parametrize("slug", ["Hello", "has space", "-leading", "trailing-", "double--dash", "中文", "under_score"])
async def test_malformed_slug_is_rejected_with_the_rule(author, slug):
    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": slug})

    assert response.status_code == 422
    assert "小写英文字母、数字和连字符" in response.text


async def test_blank_slug_on_update_keeps_the_current_one(author):
    article = await make_article(author, "keep-me")

    response = await author.put(f"{ARTICLES}/{article['id']}", json={**MINIMAL_ARTICLE, "slug": " "})

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "keep-me"


async def test_update_to_another_articles_slug_is_a_conflict(author):
    await make_article(author, "first")
    second = await make_article(author, "second")

    response = await author.put(f"{ARTICLES}/{second['id']}", json={**MINIMAL_ARTICLE, "slug": "first"})

    assert response.status_code == 409
    assert (await author.get(f"{ARTICLES}/second")).json()["data"]["slug"] == "second"


async def test_update_can_keep_its_own_slug(author):
    article = await make_article(author, "same")

    response = await author.put(f"{ARTICLES}/{article['id']}", json={**MINIMAL_ARTICLE, "slug": "same"})

    assert response.status_code == 200


async def insert_article_with_raw_slug(slug: str, published_at: str) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text(
                "insert into articles (title, slug, summary, content, published_at, read_time, is_public) "
                "values ('old', :slug, 's', 'c', :published_at, 1, true)"
            ),
            {"slug": slug, "published_at": published_at},
        )


async def test_restart_fills_in_blank_slugs_from_the_published_date(author):
    await insert_article_with_raw_slug("", "2026-03-04")
    await insert_article_with_raw_slug("   ", "")
    await make_article(author, "untouched")

    async with app.router.lifespan_context(app):
        pass
    async with app.router.lifespan_context(app):
        pass

    slugs = sorted(item["slug"] for item in (await author.get(f"{ARTICLES}/admin")).json()["data"]["items"])
    assert slugs[0].startswith("post-20260304-")
    assert re.fullmatch(rf"post-{today_compact()}-[0-9a-f]{{4}}", slugs[1])
    assert slugs[2] == "untouched"


async def test_author_can_open_a_draft_by_id(author):
    draft = await make_article(author, "draft-by-id", publish=False)

    response = await author.get(f"{ARTICLES}/admin/{draft['id']}")

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "draft-by-id"
    assert (await author.get(f"{ARTICLES}/admin/999999")).status_code == 404


async def test_visitor_cannot_open_an_article_by_id(visitor):
    assert (await visitor.get(f"{ARTICLES}/admin/1")).status_code == 401
