from sqlalchemy import text

from app.database import engine
from app.main import app
from tests.test_content import ARTICLES, make_tag

SEARCH = "/api/v1/search"


async def make_article(client, slug, *, language=None, tags=(), published_at="2026-01-01", title=None):
    payload = {
        "title": title or slug,
        "slug": slug,
        "summary": "summary",
        "content": "content",
        "published_at": published_at,
        "read_time": 3,
        "tag_slugs": list(tags),
        "is_public": True,
    }
    if language:
        payload["language"] = language
    response = await client.post(ARTICLES, json=payload)
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def slugs(client, query=""):
    response = await client.get(f"{ARTICLES}{query}")
    return [item["slug"] for item in response.json()["data"]["items"]]


async def test_an_article_is_chinese_unless_stated(author):
    article = await make_article(author, "plain")

    assert article["language"] == "zh"


async def test_unknown_language_is_rejected(author):
    response = await author.post(ARTICLES, json={
        "title": "t", "slug": "t", "summary": "s", "content": "c", "read_time": 1, "language": "fr",
    })
    assert response.status_code == 422


async def test_the_default_list_leaves_out_english_articles(author):
    await make_article(author, "chinese")
    await make_article(author, "english", language="en")

    assert await slugs(author) == ["chinese"]


async def test_english_articles_are_listed_on_their_own(author):
    await make_article(author, "chinese")
    await make_article(author, "english", language="en")

    assert await slugs(author, "?language=en") == ["english"]


async def test_tag_filter_stays_within_a_language(author):
    await make_tag(author, "rag")
    await make_article(author, "chinese", tags=["rag"])
    await make_article(author, "english", language="en", tags=["rag"])

    assert await slugs(author, "?tag=rag") == ["chinese"]
    assert await slugs(author, "?tag=rag&language=en") == ["english"]


async def test_author_list_shows_both_languages(author):
    await make_article(author, "chinese")
    await make_article(author, "english", language="en")

    response = await author.get(f"{ARTICLES}/admin")

    assert {item["language"] for item in response.json()["data"]["items"]} == {"zh", "en"}


async def test_editing_without_a_language_keeps_the_current_one(author):
    article = await make_article(author, "english", language="en")

    response = await author.put(f"{ARTICLES}/{article['id']}", json={
        "title": "edited", "slug": "english", "summary": "s", "content": "c",
        "published_at": "2026-01-01", "read_time": 1,
    })

    assert response.json()["data"]["language"] == "en"


async def test_author_can_change_the_language(author):
    article = await make_article(author, "moved")

    await author.put(f"{ARTICLES}/{article['id']}", json={
        "title": "moved", "slug": "moved", "summary": "s", "content": "c",
        "published_at": "2026-01-01", "read_time": 1, "language": "en",
    })

    assert await slugs(author) == []
    assert await slugs(author, "?language=en") == ["moved"]


async def test_related_articles_stay_within_a_language(author):
    await make_tag(author, "rag")
    await make_article(author, "current", tags=["rag"])
    await make_article(author, "chinese-peer", tags=["rag"])
    await make_article(author, "english-peer", language="en", tags=["rag"])

    response = await author.get(f"{ARTICLES}/current/related?limit=5")

    assert [item["slug"] for item in response.json()["data"]] == ["chinese-peer"]


async def test_search_finds_both_languages_and_says_which(author):
    await make_article(author, "chinese", title="langgraph 笔记")
    await make_article(author, "english", title="langgraph notes", language="en")

    response = await author.get(f"{SEARCH}?q=langgraph")

    found = {item["slug"]: item["language"] for item in response.json()["data"]["articles"]}
    assert found == {"chinese": "zh", "english": "en"}


async def test_startup_upgrades_a_database_from_before_languages(author):
    await make_article(author, "existing")
    async with engine.begin() as connection:
        await connection.execute(text("alter table articles drop column language"))

    async with app.router.lifespan_context(app):
        response = await author.get(ARTICLES)

    assert [(item["slug"], item["language"]) for item in response.json()["data"]["items"]] == [("existing", "zh")]
