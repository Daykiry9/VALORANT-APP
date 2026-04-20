"""Dynamic role benchmarks computed from `MatchPlayerStat` across tier-1 teams.

Falls back to hand-curated VCT pro averages when sample size is < 50.
Cached in-memory for 10 minutes.
"""
from __future__ import annotations

from typing import Literal

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from core.cache import cache_get, cache_set

_NAMESPACE = "benchmarks"
_CACHE_TTL = 600  # 10 min
_MIN_SAMPLES = 50

# Hand-curated VCT pro averages — fallback only.
_HARDCODED = {
    "duelist":    {"acs": 265, "kd": 1.4, "kast": 74, "adr": 155, "hs_pct": 25, "fb_rate": 22},
    "initiator":  {"acs": 210, "kd": 1.1, "kast": 78, "adr": 135, "hs_pct": 22, "fb_rate": 12},
    "controller": {"acs": 190, "kd": 1.0, "kast": 80, "adr": 120, "hs_pct": 20, "fb_rate":  8},
    "sentinel":   {"acs": 200, "kd": 1.2, "kast": 75, "adr": 125, "hs_pct": 22, "fb_rate": 10},
    "flex":       {"acs": 215, "kd": 1.15, "kast": 77, "adr": 135, "hs_pct": 22, "fb_rate": 13},
}

ROLES = tuple(_HARDCODED.keys())
Source = Literal["computed", "hardcoded"]


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    idx = max(0, min(len(s) - 1, int(round((p / 100) * (len(s) - 1)))))
    return float(s[idx])


def compute_role_benchmarks(
    db: Session,
    role: str,
    tier: str = "T1",
) -> dict:
    """Return P25/P50/P75 across all MatchPlayerStat rows for players of this role
    in matches vs opponents at the given tier. Caches for 10 min.
    """
    role_key = (role or "duelist").lower()
    cache_key = (_NAMESPACE, role_key, tier)
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    rows = (
        db.query(
            models.MatchPlayerStat.acs,
            models.MatchPlayerStat.kills,
            models.MatchPlayerStat.deaths,
            models.MatchPlayerStat.kast_pct,
            models.MatchPlayerStat.adr,
            models.MatchPlayerStat.hs_pct,
            models.MatchPlayerStat.first_bloods,
            models.MatchPlayerStat.first_deaths,
        )
        .join(models.Player, models.MatchPlayerStat.player_id == models.Player.id)
        .join(models.Match, models.MatchPlayerStat.match_id == models.Match.id)
        .filter(func.lower(models.Player.role) == role_key)
        .filter(models.Match.opponent_tier == tier)
        .all()
    )

    if len(rows) < _MIN_SAMPLES:
        result = _build_hardcoded(role_key)
        cache_set(cache_key, result, ttl=_CACHE_TTL)
        return result

    acs = [float(r.acs) for r in rows if r.acs is not None]
    kd = [
        (r.kills or 0) / max(1, r.deaths or 1)
        for r in rows
        if r.kills is not None and r.deaths is not None
    ]
    kast = [float(r.kast_pct) for r in rows if r.kast_pct is not None]
    adr = [float(r.adr) for r in rows if r.adr is not None]
    hs = [float(r.hs_pct) for r in rows if r.hs_pct is not None]
    fb_rate = [
        (r.first_bloods or 0) / max(1, (r.first_bloods or 0) + (r.first_deaths or 0) + 10)
        * 100
        for r in rows
    ]

    def pct(vals):
        return {"p25": _percentile(vals, 25), "p50": _percentile(vals, 50), "p75": _percentile(vals, 75)}

    result = {
        "role": role_key,
        "sample_size": len(rows),
        "source": "computed",
        "acs": pct(acs),
        "kd": pct(kd),
        "kast": pct(kast),
        "adr": pct(adr),
        "hs_pct": pct(hs),
        "fb_rate": pct(fb_rate),
    }
    cache_set(cache_key, result, ttl=_CACHE_TTL)
    return result


def _build_hardcoded(role_key: str) -> dict:
    base = _HARDCODED.get(role_key, _HARDCODED["duelist"])
    def band(center: float, spread: float):
        return {"p25": center * (1 - spread), "p50": center, "p75": center * (1 + spread)}
    return {
        "role": role_key,
        "sample_size": 0,
        "source": "hardcoded",
        "acs": band(base["acs"], 0.12),
        "kd": band(base["kd"], 0.15),
        "kast": band(base["kast"], 0.08),
        "adr": band(base["adr"], 0.12),
        "hs_pct": band(base["hs_pct"], 0.15),
        "fb_rate": band(base["fb_rate"], 0.25),
    }
