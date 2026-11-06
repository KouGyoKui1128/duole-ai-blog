from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

# create_all only adds missing tables, so a new column on an existing table goes here.
# Every statement must be safe to run on each start.
COLUMN_UPGRADES = [
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'zh'",
]


async def run_migrations(connection: AsyncConnection) -> None:
    for statement in COLUMN_UPGRADES:
        await connection.execute(text(statement))
