from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


MIGRATION_SQL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'editor',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_reason TEXT;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS review_reason TEXT;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;",
    "ALTER TABLE resume ADD COLUMN IF NOT EXISTS created_by INTEGER;",
    "ALTER TABLE resume ADD COLUMN IF NOT EXISTS updated_by INTEGER;",
    """
    CREATE TABLE IF NOT EXISTS user_applications (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        requested_role VARCHAR(20) NOT NULL DEFAULT 'editor',
        motivation TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        initial_password VARCHAR(255),
        review_note TEXT,
        reviewed_by INTEGER,
        reviewed_at TIMESTAMPTZ,
        created_user_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    "ALTER TABLE user_applications ADD COLUMN IF NOT EXISTS initial_password VARCHAR(255);",
    "UPDATE users SET role = 'editor' WHERE role = 'viewer';",
    "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'editor';",
    "UPDATE user_applications SET requested_role = 'editor' WHERE requested_role <> 'editor';",
    "ALTER TABLE user_applications ALTER COLUMN requested_role SET DEFAULT 'editor';",
    "UPDATE articles SET created_by = (SELECT id FROM users WHERE email = 'admin@duole.ai' LIMIT 1);",
    "UPDATE articles SET updated_by = (SELECT id FROM users WHERE email = 'admin@duole.ai' LIMIT 1);",
]


async def run_migrations(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        for stmt in MIGRATION_SQL:
            await conn.execute(text(stmt))
