"""Lightweight in-memory TTL cache for analytics queries.

Keyed by (namespace, team_id, *args). Invalidate on mutations affecting the
team (match create, player roster change). Intentionally process-local — swap
for Redis when horizontally scaling.
"""
from __future__ import annotations

import time
from functools import wraps
from threading import RLock
from typing import Any, Callable, Hashable
from uuid import UUID

_DEFAULT_TTL = 300  # 5 min
_lock = RLock()
_store: dict[tuple, tuple[float, Any]] = {}


def _now() -> float:
    return time.monotonic()


def cache_get(key: tuple) -> Any | None:
    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if expires_at < _now():
            _store.pop(key, None)
            return None
        return value


def cache_set(key: tuple, value: Any, ttl: int = _DEFAULT_TTL) -> None:
    with _lock:
        _store[key] = (_now() + ttl, value)


def invalidate_team(team_id: UUID | str) -> None:
    """Drop every cache entry whose key mentions this team_id."""
    tid = str(team_id)
    with _lock:
        for key in list(_store.keys()):
            if any(str(part) == tid for part in key):
                _store.pop(key, None)


def invalidate_all() -> None:
    with _lock:
        _store.clear()


def cached(namespace: str, ttl: int = _DEFAULT_TTL, key_fn: Callable[..., tuple] | None = None):
    """Decorator. Default key = (namespace, *args as strings).

    Supply `key_fn(*args, **kwargs) -> tuple` when arguments need normalization.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if key_fn:
                raw = key_fn(*args, **kwargs)
            else:
                raw = tuple(_hashable(a) for a in args)
            key = (namespace,) + raw
            hit = cache_get(key)
            if hit is not None:
                return hit
            result = fn(*args, **kwargs)
            cache_set(key, result, ttl=ttl)
            return result
        return wrapper
    return decorator


def _hashable(v: Any) -> Hashable:
    try:
        hash(v)
        return v
    except TypeError:
        return repr(v)
