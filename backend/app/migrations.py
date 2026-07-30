from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


MIGRATION_SQL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
    "ALTER TABLE resume ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE resume ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
]


async def run_migrations(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        for stmt in MIGRATION_SQL:
            await conn.execute(text(stmt))
