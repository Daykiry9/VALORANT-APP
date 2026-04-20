"""Typed application errors and consistent JSON error shape.

Every unhandled AppError subclass is turned into
`{ "error": { "code", "message", "request_id", "details" } }` by the global
exception handler installed in `main.py`.
"""
from __future__ import annotations

from typing import Any, Optional


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFound(AppError):
    status_code = 404
    code = "not_found"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class UpstreamError(AppError):
    """Failure from a third-party service (Gemini, Riot API, Supabase)."""
    status_code = 502
    code = "upstream_error"
