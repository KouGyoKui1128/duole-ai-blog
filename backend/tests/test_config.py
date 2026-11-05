import pytest

from app.config import ConfigError, load_settings

VALID = {
    "DATABASE_URL": "postgresql+asyncpg://u:p@localhost:5432/blog",
    "SECRET_KEY": "k" * 40,
}


def test_refuses_to_start_without_secret_key():
    env = {k: v for k, v in VALID.items() if k != "SECRET_KEY"}
    with pytest.raises(ConfigError, match="SECRET_KEY"):
        load_settings(env)


def test_refuses_to_start_without_database_url():
    env = {k: v for k, v in VALID.items() if k != "DATABASE_URL"}
    with pytest.raises(ConfigError, match="DATABASE_URL"):
        load_settings(env)


@pytest.mark.parametrize("secret", ["short", "duole-dev-secret-change-me", "replace-this-with-a-long-random-string"])
def test_refuses_weak_or_published_secret_keys(secret):
    with pytest.raises(ConfigError, match="SECRET_KEY"):
        load_settings({**VALID, "SECRET_KEY": secret})


def test_hosted_postgres_url_becomes_asyncpg_url():
    settings = load_settings({
        **VALID,
        "DATABASE_URL": "postgresql://u:p@ep-x.neon.tech/blog?sslmode=require&channel_binding=require",
    })
    assert settings.database_url == "postgresql+asyncpg://u:p@ep-x.neon.tech/blog?ssl=require"


def test_cookies_are_secure_unless_explicitly_disabled():
    assert load_settings(VALID).cookie_secure is True
    assert load_settings({**VALID, "COOKIE_SECURE": "false"}).cookie_secure is False


def test_cors_origins_come_from_the_environment():
    settings = load_settings({**VALID, "CORS_ORIGINS": "https://a.example, https://b.example"})
    assert settings.cors_origins == ["https://a.example", "https://b.example"]


def test_demo_data_is_off_by_default():
    assert load_settings(VALID).seed_demo_data is False
