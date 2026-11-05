import os
from dataclasses import dataclass
from typing import Mapping
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv

MIN_SECRET_KEY_LENGTH = 32
PUBLISHED_SECRET_KEYS = {
    "duole-dev-secret-change-me",
    "replace-this-with-a-long-random-string",
}
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    database_url: str
    secret_key: str
    access_token_expire_minutes: int
    cookie_secure: bool
    cors_origins: list[str]
    author_email: str
    author_password: str
    seed_demo_data: bool


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise ConfigError(f"{name} must be set")
    return value


def _flag(env: Mapping[str, str], name: str, default: bool) -> bool:
    value = env.get(name, "").strip().lower()
    if not value:
        return default
    return value in {"1", "true", "yes", "on"}


def _asyncpg_url(url: str) -> str:
    """Hosted Postgres URLs use libpq options that asyncpg rejects."""
    parts = urlsplit(url)
    scheme = "postgresql+asyncpg" if parts.scheme in {"postgres", "postgresql"} else parts.scheme
    query = dict(parse_qsl(parts.query))
    query.pop("channel_binding", None)
    sslmode = query.pop("sslmode", None)
    if sslmode:
        query["ssl"] = sslmode
    return urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def load_settings(env: Mapping[str, str]) -> Settings:
    secret_key = _required(env, "SECRET_KEY")
    if len(secret_key) < MIN_SECRET_KEY_LENGTH or secret_key in PUBLISHED_SECRET_KEYS:
        raise ConfigError(f"SECRET_KEY must be a private random string of at least {MIN_SECRET_KEY_LENGTH} characters")

    origins = env.get("CORS_ORIGINS", "").strip() or DEFAULT_CORS_ORIGINS
    return Settings(
        database_url=_asyncpg_url(_required(env, "DATABASE_URL")),
        secret_key=secret_key,
        access_token_expire_minutes=int(env.get("ACCESS_TOKEN_EXPIRE_MINUTES", "").strip() or "10080"),
        cookie_secure=_flag(env, "COOKIE_SECURE", True),
        cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
        author_email=env.get("AUTHOR_EMAIL", "").strip(),
        author_password=env.get("AUTHOR_PASSWORD", "").strip(),
        seed_demo_data=_flag(env, "SEED_DEMO_DATA", False),
    )


load_dotenv()
settings = load_settings(os.environ)
