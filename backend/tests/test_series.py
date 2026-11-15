from sqlalchemy import text

from app.database import engine
from app.main import app
from tests.test_content import ARTICLES, make_article

SERIES = "/api/v1/series"


async def make_series(client, slug, *, language="zh", sort=0, title=None):
    response = await client.post(SERIES, json={
        "title": title or slug, "slug": slug, "summary": "summary", "language": language, "sort": sort,
    })
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def put_in_series(client, article, series, order=None):
    response = await client.put(f"{ARTICLES}/{article['id']}", json={
        "title": article["title"],
        "slug": article["slug"],
        "summary": article["summary"],
        "content": article["content"],
        "published_at": article["published_at"],
        "read_time": article["read_time"],
        "language": article["language"],
        "series_id": series["id"] if series else None,
        "series_order": order,
    })
    return response


async def test_visitors_see_only_series_with_a_published_article(author):
    empty = await make_series(author, "empty")
    drafts_only = await make_series(author, "drafts-only")
    live = await make_series(author, "live")
    await put_in_series(author, await make_article(author, "draft", publish=False), drafts_only, 1)
    await put_in_series(author, await make_article(author, "post"), live, 1)

    response = await author.get(SERIES)

    assert [(item["slug"], item["article_count"]) for item in response.json()["data"]] == [("live", 1)]
    assert empty["slug"] == "empty"


async def test_series_page_lists_published_articles_in_reading_order(author):
    series = await make_series(author, "langgraph")
    third = await make_article(author, "third", published_at="2026-01-01")
    first = await make_article(author, "first", published_at="2026-03-01")
    draft = await make_article(author, "draft", publish=False)
    second = await make_article(author, "second", published_at="2026-02-01")
    for article, order in [(third, 3), (first, 1), (draft, 2), (second, 2)]:
        assert (await put_in_series(author, article, series, order)).status_code == 200

    data = (await author.get(f"{SERIES}/langgraph")).json()["data"]

    assert data["title"] == "langgraph"
    assert [item["slug"] for item in data["articles"]] == ["first", "second", "third"]


async def test_unknown_or_unpublished_series_is_not_found(author):
    await make_series(author, "empty")

    assert (await author.get(f"{SERIES}/empty")).json()["data"] is None
    assert (await author.get(f"{SERIES}/missing")).json()["data"] is None


async def test_article_shows_its_place_in_the_series(author):
    series = await make_series(author, "rag", title="RAG 入门")
    for index, slug in enumerate(["one", "two", "three"], start=1):
        await put_in_series(author, await make_article(author, slug), series, index)

    middle = (await author.get(f"{ARTICLES}/two")).json()["data"]["series"]
    first = (await author.get(f"{ARTICLES}/one")).json()["data"]["series"]

    assert middle == {
        "title": "RAG 入门",
        "slug": "rag",
        "position": 2,
        "total": 3,
        "previous": {"title": "one", "slug": "one"},
        "next": {"title": "three", "slug": "three"},
    }
    assert first["previous"] is None


async def test_drafts_do_not_count_in_the_series_position(author):
    series = await make_series(author, "rag")
    await put_in_series(author, await make_article(author, "draft", publish=False), series, 1)
    await put_in_series(author, await make_article(author, "live"), series, 2)

    context = (await author.get(f"{ARTICLES}/live")).json()["data"]["series"]

    assert (context["position"], context["total"], context["previous"]) == (1, 1, None)


async def test_article_outside_a_series_has_no_series(author):
    await make_article(author, "alone")

    assert (await author.get(f"{ARTICLES}/alone")).json()["data"]["series"] is None


async def test_article_without_a_number_goes_to_the_end(author):
    series = await make_series(author, "rag")
    await put_in_series(author, await make_article(author, "one"), series, 4)

    response = await put_in_series(author, await make_article(author, "two"), series)

    assert response.json()["data"]["series_order"] == 5


async def test_article_cannot_join_a_series_in_another_language(author):
    series = await make_series(author, "english-only", language="en")

    response = await put_in_series(author, await make_article(author, "chinese"), series, 1)

    assert response.status_code == 422
    assert "语言" in response.text


async def test_update_without_series_fields_keeps_the_article_in_its_series(author):
    series = await make_series(author, "rag")
    article = await make_article(author, "one")
    await put_in_series(author, article, series, 1)

    await author.put(f"{ARTICLES}/{article['id']}", json={
        "title": "renamed", "summary": "s", "content": "c", "published_at": "2026-01-01", "read_time": 1,
    })

    assert (await author.get(f"{ARTICLES}/one")).json()["data"]["series"]["position"] == 1


async def test_deleting_a_series_keeps_its_articles(author):
    series = await make_series(author, "rag")
    await put_in_series(author, await make_article(author, "one"), series, 1)

    assert (await author.delete(f"{SERIES}/{series['id']}")).status_code == 200

    article = (await author.get(f"{ARTICLES}/one")).json()["data"]
    assert (article["series"], article["series_id"], article["series_order"]) == (None, None, None)


async def test_author_list_includes_empty_series_in_sort_order(author):
    await make_series(author, "later", sort=2)
    await make_series(author, "sooner", sort=1)

    data = (await author.get(f"{SERIES}/admin")).json()["data"]

    assert [item["slug"] for item in data] == ["sooner", "later"]


async def test_public_list_can_be_filtered_by_language(author):
    zh = await make_series(author, "zh-series")
    en = await make_series(author, "en-series", language="en")
    await put_in_series(author, await make_article(author, "zh-post"), zh, 1)
    english = await make_article(author, "en-post")
    await author.put(f"{ARTICLES}/{english['id']}", json={**english, "language": "en", "series_id": en["id"]})

    response = await author.get(f"{SERIES}?language=en")

    assert [item["slug"] for item in response.json()["data"]] == ["en-series"]


async def test_series_slug_must_be_unique_and_well_formed(author):
    await make_series(author, "rag")

    assert (await author.post(SERIES, json={"title": "t", "slug": "rag"})).status_code == 409
    assert (await author.post(SERIES, json={"title": "t", "slug": "Not OK"})).status_code == 422


async def test_series_language_cannot_change_while_it_has_articles(author):
    series = await make_series(author, "rag")
    await put_in_series(author, await make_article(author, "one"), series, 1)

    response = await author.put(f"{SERIES}/{series['id']}", json={"title": "rag", "slug": "rag", "language": "en"})

    assert response.status_code == 422


async def test_visitor_cannot_write_series(visitor):
    assert (await visitor.post(SERIES, json={"title": "t", "slug": "t"})).status_code == 401
    assert (await visitor.get(f"{SERIES}/admin")).status_code == 401


async def test_restart_adds_series_columns_to_an_existing_database(author):
    async with engine.begin() as connection:
        await connection.execute(text("alter table articles drop column series_id, drop column series_order"))
        await connection.execute(text("drop table series"))

    async with app.router.lifespan_context(app):
        pass
    async with app.router.lifespan_context(app):
        pass

    series = await make_series(author, "after-upgrade")
    response = await put_in_series(author, await make_article(author, "one"), series, 1)
    assert response.json()["data"]["series_id"] == series["id"]
