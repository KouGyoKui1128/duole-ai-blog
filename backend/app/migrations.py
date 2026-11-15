from datetime import date, datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.slugs import generate_slug

# create_all only adds missing tables, so a new column on an existing table goes here.
# Every statement must be safe to run on each start.
COLUMN_UPGRADES = [
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'zh'",
]


def _day_of(published_at: str) -> date:
    try:
        return datetime.strptime(published_at.strip(), "%Y-%m-%d").date()
    except ValueError:
        return datetime.now(timezone.utc).date()


async def fill_blank_article_slugs(connection: AsyncConnection) -> None:
    """Articles saved before slugs were required had '' and opened the list page instead."""
    rows = await connection.execute(
        text("SELECT id, published_at FROM articles WHERE trim(slug) = '' ORDER BY id")
    )

    async def is_taken(slug: str) -> bool:
        found = await connection.scalar(text("SELECT 1 FROM articles WHERE slug = :slug"), {"slug": slug})
        return found is not None

    for article_id, published_at in rows.all():
        slug = await generate_slug(_day_of(published_at or ""), is_taken)
        await connection.execute(
            text("UPDATE articles SET slug = :slug WHERE id = :id"), {"slug": slug, "id": article_id}
        )


async def run_migrations(connection: AsyncConnection) -> None:
    for statement in COLUMN_UPGRADES:
        await connection.execute(text(statement))
    await fill_blank_article_slugs(connection)
