"""Rate limiter. Applied to expensive endpoints (AI, reports) to prevent
Gemini API key burn and abuse.

Keyed by (team_id when authenticated, else IP). Limits per route are enforced
via `@limiter.limit("N/minute")` decorators.
"""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _key_func(request: Request) -> str:
    """Use `X-Team-Id` header if provided (set by frontend after team resolve),
    otherwise fall back to client IP. Works for authenticated and dev-bypass flows."""
    team_id = request.headers.get("x-team-id")
    if team_id:
        return f"team:{team_id}"
    return f"ip:{get_remote_address(request)}"


_enabled = os.getenv("RATE_LIMIT_ENABLED", "1") == "1"

limiter = Limiter(
    key_func=_key_func,
    enabled=_enabled,
    default_limits=[],  # default off; opt-in per route
    headers_enabled=True,
    storage_uri="memory://",
)
