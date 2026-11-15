"""Article slugs: the part of an article's URL after /blog/ or /english/."""
import re
import secrets
from collections.abc import Awaitable, Callable
from datetime import date

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SLUG_RULE = "slug 只能包含小写英文字母、数字和连字符，连字符不能出现在开头、结尾或连续出现，例如 feishu-personal-assistant"
GENERATE_ATTEMPTS = 5


def candidate_slug(day: date) -> str:
    return f"post-{day:%Y%m%d}-{secrets.token_hex(2)}"


async def generate_slug(day: date, is_taken: Callable[[str], Awaitable[bool]]) -> str:
    """A post-YYYYMMDD-xxxx slug that is_taken says is free; gives up after a few collisions."""
    for _ in range(GENERATE_ATTEMPTS):
        slug = candidate_slug(day)
        if not await is_taken(slug):
            return slug
    raise RuntimeError("Could not generate a free slug")
