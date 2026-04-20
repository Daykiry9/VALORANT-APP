"""Cross-match player aggregations.

All queries scope by (player_id, team_id) to prevent leakage across teams.
Results cached by team via `core.cache` for 5 min.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, case, desc, func
from sqlalchemy.orm import Session

import models
from core.cache import cached
from core.errors import NotFound


# --------- helpers ---------

def _get_player(db: Session, player_id: UUID, team_id: UUID) -> models.Player:
    player = (
        db.query(models.Player)
        .filter(models.Player.id == player_id, models.Player.team_id == team_id)
        .first()
    )
    if not player:
        raise NotFound("Player not found in this team.")
    return player


def _kd(kills: int, deaths: int) -> float:
    return round((kills or 0) / max(1, deaths or 1), 2)


# --------- summary ---------

@cached(namespace="player_summary", ttl=300)
def player_summary(db: Session, player_id: UUID, team_id: UUID) -> dict:
    player = _get_player(db, player_id, team_id)

    rows = (
        db.query(
            models.MatchPlayerStat,
            models.Match.result,
        )
        .join(models.Match, models.MatchPlayerStat.match_id == models.Match.id)
        .filter(models.MatchPlayerStat.player_id == player_id)
        .all()
    )

    if not rows:
        return {
            "player_id": str(player_id),
            "display_name": player.display_name or "",
            "role": player.role,
            "is_tryout": bool(player.is_tryout),
            "matches_played": 0,
            "wins": 0, "losses": 0, "winrate": 0.0,
            "avg_acs": 0.0, "kd": 0.0,
            "avg_kast": 0.0, "avg_adr": 0.0, "avg_hs_pct": 0.0,
            "fb_rate": 0.0, "fd_rate": 0.0,
        }

    total_k = sum((r.MatchPlayerStat.kills or 0) for r in rows)
    total_d = sum((r.MatchPlayerStat.deaths or 0) for r in rows)
    total_fb = sum((r.MatchPlayerStat.first_bloods or 0) for r in rows)
    total_fd = sum((r.MatchPlayerStat.first_deaths or 0) for r in rows)
    matches = len(rows)
    wins = sum(1 for r in rows if (r.result or "").upper() == "W")
    losses = sum(1 for r in rows if (r.result or "").upper() == "L")

    def avg(attr: str) -> float:
        vals = [float(getattr(r.MatchPlayerStat, attr)) for r in rows if getattr(r.MatchPlayerStat, attr) is not None]
        return round(sum(vals) / len(vals), 2) if vals else 0.0

    return {
        "player_id": str(player_id),
        "display_name": player.display_name or "",
        "role": player.role,
        "is_tryout": bool(player.is_tryout),
        "matches_played": matches,
        "wins": wins,
        "losses": losses,
        "winrate": round((wins / matches) * 100, 1) if matches else 0.0,
        "avg_acs": avg("acs"),
        "kd": _kd(total_k, total_d),
        "avg_kast": avg("kast_pct"),
        "avg_adr": avg("adr"),
        "avg_hs_pct": avg("hs_pct"),
        "fb_rate": round(total_fb / matches, 2) if matches else 0.0,
        "fd_rate": round(total_fd / matches, 2) if matches else 0.0,
    }


# --------- by-agent ---------

@cached(namespace="player_by_agent", ttl=300)
def player_by_agent(db: Session, player_id: UUID, team_id: UUID) -> List[dict]:
    _get_player(db, player_id, team_id)

    win_case = case((models.Match.result == "W", 1), else_=0)

    rows = (
        db.query(
            models.MatchPlayerStat.agent.label("agent"),
            func.count(models.MatchPlayerStat.id).label("games"),
            func.sum(win_case).label("wins"),
            func.avg(models.MatchPlayerStat.acs).label("avg_acs"),
            func.sum(models.MatchPlayerStat.kills).label("k"),
            func.sum(models.MatchPlayerStat.deaths).label("d"),
        )
        .join(models.Match, models.MatchPlayerStat.match_id == models.Match.id)
        .filter(models.MatchPlayerStat.player_id == player_id)
        .filter(models.MatchPlayerStat.agent.isnot(None))
        .group_by(models.MatchPlayerStat.agent)
        .order_by(desc("games"))
        .all()
    )

    result = []
    for r in rows:
        games = int(r.games or 0)
        wins = int(r.wins or 0)
        result.append({
            "agent": r.agent,
            "games": games,
            "wins": wins,
            "winrate": round((wins / games) * 100, 1) if games else 0.0,
            "avg_acs": round(float(r.avg_acs or 0), 1),
            "kd": _kd(int(r.k or 0), int(r.d or 0)),
        })
    return result


# --------- by-map ---------

@cached(namespace="player_by_map", ttl=300)
def player_by_map(db: Session, player_id: UUID, team_id: UUID) -> List[dict]:
    _get_player(db, player_id, team_id)

    win_case = case((models.Match.result == "W", 1), else_=0)

    rows = (
        db.query(
            models.Match.map_name.label("map_name"),
            func.count(models.MatchPlayerStat.id).label("games"),
            func.sum(win_case).label("wins"),
            func.avg(models.MatchPlayerStat.acs).label("avg_acs"),
            func.sum(models.MatchPlayerStat.kills).label("k"),
            func.sum(models.MatchPlayerStat.deaths).label("d"),
        )
        .join(models.Match, models.MatchPlayerStat.match_id == models.Match.id)
        .filter(models.MatchPlayerStat.player_id == player_id)
        .filter(models.Match.map_name.isnot(None))
        .group_by(models.Match.map_name)
        .order_by(desc("games"))
        .all()
    )

    result = []
    for r in rows:
        games = int(r.games or 0)
        wins = int(r.wins or 0)
        result.append({
            "map_name": r.map_name,
            "games": games,
            "wins": wins,
            "winrate": round((wins / games) * 100, 1) if games else 0.0,
            "avg_acs": round(float(r.avg_acs or 0), 1),
            "kd": _kd(int(r.k or 0), int(r.d or 0)),
        })
    return result


# --------- trend ---------

@cached(namespace="player_trend", ttl=300)
def player_trend(db: Session, player_id: UUID, team_id: UUID, window: int = 20) -> List[dict]:
    _get_player(db, player_id, team_id)

    rows = (
        db.query(models.MatchPlayerStat, models.Match)
        .join(models.Match, models.MatchPlayerStat.match_id == models.Match.id)
        .filter(models.MatchPlayerStat.player_id == player_id)
        .order_by(models.Match.date.desc())
        .limit(window)
        .all()
    )

    out = []
    # Oldest first for charting.
    for stat, match in reversed(rows):
        out.append({
            "match_id": str(match.id),
            "date": match.date.isoformat() if match.date else None,
            "map_name": match.map_name,
            "result": match.result,
            "acs": float(stat.acs or 0),
            "kd": _kd(stat.kills or 0, stat.deaths or 0),
            "kast": float(stat.kast_pct or 0),
            "adr": float(stat.adr or 0),
            "hs_pct": float(stat.hs_pct or 0),
        })
    return out
