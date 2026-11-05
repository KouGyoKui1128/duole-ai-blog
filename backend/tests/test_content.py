from dataclasses import replace
from datetime import datetime, timezone

import pytest
from sqlalchemy import text

from app.api.v1 import auth as auth_api
from app.auth import hash_password
from app.database import engine
from tests.conftest import AUTHOR_EMAIL, AUTHOR_PASSWORD

ARTICLES = "/api/v1/articles"
PROJECTS = "/api/v1/projects"
TAGS = "/api/v1/tags"
MINIMAL_ARTICLE = {
    "title": "t", "slug": "t", "summary": "s", "content": "c", "published_at": "2026-01-01", "read_time": 1,
}


async def make_tag(client, slug):
    response = await client.post(TAGS, json={"name": slug, "slug": slug, "color": "#000000"})
    assert response.status_code == 200


async def make_article(client, slug, *, published_at="2026-01-01", tags=(), publish=True):
    response = await client.post(ARTICLES, json={
        "title": slug,
        "slug": slug,
        "summary": "summary",
        "content": "content",
        "published_at": published_at,
        "read_time": 3,
        "tag_slugs": list(tags),
        "is_public": publish,
    })
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def make_project(client, slug, *, publish=True):
    response = await client.post(PROJECTS, json={
        "title": slug,
        "slug": slug,
        "summary": "summary",
        "description": "description",
        "tech_stack": ["Python"],
        "repo_url": "https://example.com/repo",
        "is_public": publish,
    })
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def public_slugs(client, query=""):
    response = await client.get(f"{ARTICLES}{query}")
    return [item["slug"] for item in response.json()["data"]["items"]]


async def test_visitor_cannot_write_content(visitor):
    response = await visitor.post(ARTICLES, json=MINIMAL_ARTICLE)
    assert response.status_code == 401


async def test_only_the_author_can_write_content(visitor):
    async with engine.begin() as connection:
        await connection.execute(
            text(
                "insert into users (username, email, password_hash, role, is_active) "
                "values ('old', :email, :hash, 'editor', true)"
            ),
            {"email": "old-editor@example.com", "hash": hash_password("old-editor-password")},
        )
    await visitor.post(
        "/api/v1/auth/login",
        json={"email": "old-editor@example.com", "password": "old-editor-password"},
    )

    response = await visitor.post(ARTICLES, json=MINIMAL_ARTICLE)

    assert response.status_code == 403


async def test_new_article_without_a_status_is_a_draft(author):
    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "slug": "draft"})

    assert response.json()["data"]["is_public"] is False
    assert await public_slugs(author) == []
    assert (await author.get(f"{ARTICLES}/draft")).json()["data"] is None


async def test_author_can_publish_and_unpublish_an_article(author):
    article = await make_article(author, "post", publish=False)

    published = await author.post(f"{ARTICLES}/{article['id']}/publish", json={"is_public": True})
    assert published.status_code == 200
    assert await public_slugs(author) == ["post"]

    await author.post(f"{ARTICLES}/{article['id']}/publish", json={"is_public": False})
    assert await public_slugs(author) == []


async def test_author_list_includes_drafts(author):
    await make_article(author, "draft", publish=False)
    await make_article(author, "live")

    response = await author.get(f"{ARTICLES}/admin")

    assert {item["slug"] for item in response.json()["data"]["items"]} == {"draft", "live"}


async def test_articles_are_listed_newest_first_by_published_date(author):
    await make_article(author, "middle", published_at="2026-02-01")
    await make_article(author, "newest", published_at="2026-03-01")
    await make_article(author, "oldest", published_at="2026-01-01")

    assert await public_slugs(author) == ["newest", "middle", "oldest"]


async def test_published_article_with_a_blank_date_is_dated_today(author):
    article = await make_article(author, "today", published_at="")

    assert article["published_at"] == datetime.now(timezone.utc).date().isoformat()


async def test_malformed_published_date_is_rejected(author):
    response = await author.post(ARTICLES, json={**MINIMAL_ARTICLE, "published_at": "July 4th"})
    assert response.status_code == 422


async def test_tag_filter_returns_only_matching_articles(author):
    await make_tag(author, "rag")
    await make_tag(author, "agent")
    await make_article(author, "rag-post", tags=["rag"])
    await make_article(author, "agent-post", tags=["agent"])
    await make_article(author, "rag-draft", tags=["rag"], publish=False)

    response = await author.get(f"{ARTICLES}?tag=rag")

    data = response.json()["data"]
    assert [item["slug"] for item in data["items"]] == ["rag-post"]
    assert data["total"] == 1


async def test_related_articles_prefer_shared_tags(author):
    await make_tag(author, "rag")
    await make_tag(author, "agent")
    await make_article(author, "current", tags=["rag", "agent"], published_at="2026-01-01")
    await make_article(author, "newest-unrelated", published_at="2026-06-01")
    await make_article(author, "one-shared", tags=["agent"], published_at="2026-02-01")
    await make_article(author, "two-shared", tags=["rag", "agent"], published_at="2026-01-15")
    await make_article(author, "draft-shared", tags=["rag", "agent"], published_at="2026-03-01", publish=False)

    response = await author.get(f"{ARTICLES}/current/related?limit=2")

    assert [item["slug"] for item in response.json()["data"]] == ["two-shared", "one-shared"]


async def test_articles_without_a_shared_tag_are_not_related(author):
    await make_tag(author, "rag")
    await make_tag(author, "agent")
    await make_article(author, "current", tags=["rag"], published_at="2026-01-01")
    await make_article(author, "other-topic", tags=["agent"], published_at="2026-05-01")
    await make_article(author, "no-tags", published_at="2026-06-01")

    response = await author.get(f"{ARTICLES}/current/related?limit=2")

    assert response.json()["data"] == []


async def test_draft_without_a_date_is_dated_when_it_is_published(author):
    draft = await make_article(author, "draft", published_at="", publish=False)
    assert draft["published_at"] == ""

    response = await author.post(f"{ARTICLES}/{draft['id']}/publish", json={"is_public": True})

    assert response.json()["data"]["published_at"] == datetime.now(timezone.utc).date().isoformat()


async def test_publishing_keeps_a_date_the_author_chose(author):
    draft = await make_article(author, "dated", published_at="2026-02-03", publish=False)

    response = await author.post(f"{ARTICLES}/{draft['id']}/publish", json={"is_public": True})

    assert response.json()["data"]["published_at"] == "2026-02-03"


async def test_projects_follow_the_same_draft_and_publish_rules(author):
    project = await make_project(author, "side-project", publish=False)
    assert (await author.get(PROJECTS)).json()["data"]["items"] == []

    await author.post(f"{PROJECTS}/{project['id']}/publish", json={"is_public": True})

    assert [item["slug"] for item in (await author.get(PROJECTS)).json()["data"]["items"]] == ["side-project"]


async def test_projects_are_listed_newest_first(author):
    await make_project(author, "first")
    await make_project(author, "second")

    items = (await author.get(PROJECTS)).json()["data"]["items"]

    assert [item["slug"] for item in items] == ["second", "first"]


@pytest.mark.parametrize("method,path", [
    ("GET", "/api/v1/applications/status?email=someone@example.com"),
    ("POST", "/api/v1/applications"),
    ("GET", "/api/v1/users"),
    ("POST", "/api/v1/uploads/images"),
    ("POST", "/api/v1/articles/1/review"),
    ("POST", "/api/v1/projects/1/review"),
])
async def test_multi_author_endpoints_are_gone(author, method, path):
    response = await author.request(method, path)
    assert response.status_code in {404, 405}


async def test_session_cookie_is_secure_when_configured(visitor, monkeypatch):
    monkeypatch.setattr(auth_api, "settings", replace(auth_api.settings, cookie_secure=True))

    response = await visitor.post("/api/v1/auth/login", json={"email": AUTHOR_EMAIL, "password": AUTHOR_PASSWORD})

    cookie = response.headers["set-cookie"].lower()
    assert "secure" in cookie
    assert "httponly" in cookie
