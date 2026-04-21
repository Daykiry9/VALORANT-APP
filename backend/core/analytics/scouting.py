"""Opponent scouting: aggregate everything we know about a rival from our matches
against them. Feeds both the UI page and the scouting AI prompt.
"""
from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

import models
from core.cache import cached


@cached(namespace="scouting_opponents", ttl=300)
def list_opponents(db: Session, team_id: UUID) -> List[dict]:
    """Every opponent we've ever faced + headline stats."""
    win_case = case((models.Match.result == "W", 1), else_=0)
    rows = (
        db.query(
            models.Match.opponent_name.label("name"),
            models.Match.opponent_tier.label("tier"),
            func.count(models.Match.id).label("games"),
            func.sum(win_case).label("wins"),
            func.max(models.Match.date).label("last_faced"),
        )
        .filter(models.Match.team_id == team_id)
        .filter(models.Match.opponent_name.isnot(None))
        .group_by(models.Match.opponent_name, models.Match.opponent_tier)
        .order_by(desc("last_faced"))
        .all()
    )
    return [
        {
            "name": r.name,
            "tier": r.tier,
            "games": int(r.games or 0),
            "wins": int(r.wins or 0),
            "winrate": round((int(r.wins or 0) / int(r.games)) * 100, 1) if r.games else 0.0,
            "last_faced": r.last_faced.isoformat() if r.last_faced else None,
        }
        for r in rows
    ]


@cached(namespace="scouting_report", ttl=300)
def scouting_report(db: Session, team_id: UUID, opponent_name: str) -> dict:
    """Aggregate stats for matches played against `opponent_name`.

    Returns everything useful for a pre-match briefing: per-map winrate, pistol
    pattern, composition pattern (their side), avg score, sample of matches.
    """
    win_case = case((models.Match.result == "W", 1), else_=0)

    matches = (
        db.query(models.Match)
        .filter(models.Match.team_id == team_id)
        .filter(models.Match.opponent_name == opponent_name)
        .order_by(models.Match.date.desc())
        .all()
    )

    if not matches:
        return {
            "opponent_name": opponent_name,
            "total_games": 0,
            "wins": 0, "losses": 0, "draws": 0,
            "winrate": 0.0,
            "by_map": [],
            "pistol_pattern": {"def_won": 0, "att_won": 0, "def_lost": 0, "att_lost": 0},
            "avg_round_diff": 0.0,
            "recent_matches": [],
        }

    total = len(matches)
    wins = sum(1 for m in matches if (m.result or "").upper() == "W")
    losses = sum(1 for m in matches if (m.result or "").upper() == "L")
    draws = sum(1 for m in matches if (m.result or "").upper() == "D")

    per_map_rows = (
        db.query(
            models.Match.map_name.label("map_name"),
            func.count(models.Match.id).label("games"),
            func.sum(win_case).label("wins"),
            func.avg(models.Match.team_rounds_won).label("rw"),
            func.avg(models.Match.team_rounds_lost).label("rl"),
        )
        .filter(models.Match.team_id == team_id)
        .filter(models.Match.opponent_name == opponent_name)
        .filter(models.Match.map_name.isnot(None))
        .group_by(models.Match.map_name)
        .order_by(desc("games"))
        .all()
    )

    by_map = [
        {
            "map_name": r.map_name,
            "games": int(r.games or 0),
            "wins": int(r.wins or 0),
            "winrate": round((int(r.wins or 0) / int(r.games)) * 100, 1) if r.games else 0.0,
            "avg_round_diff": round(float(r.rw or 0) - float(r.rl or 0), 2),
        }
        for r in per_map_rows
    ]

    pistol_pattern = {
        "def_won": sum(1 for m in matches if m.def_pistol == "W"),
        "def_lost": sum(1 for m in matches if m.def_pistol == "L"),
        "att_won": sum(1 for m in matches if m.att_pistol == "W"),
        "att_lost": sum(1 for m in matches if m.att_pistol == "L"),
    }

    avg_rw = sum(m.team_rounds_won or 0 for m in matches) / total
    avg_rl = sum(m.team_rounds_lost or 0 for m in matches) / total

    recent = [
        {
            "match_id": str(m.id),
            "date": m.date.isoformat() if m.date else None,
            "map_name": m.map_name,
            "result": m.result,
            "score": f"{m.team_rounds_won or 0}-{m.team_rounds_lost or 0}",
            "composition": m.composition,
        }
        for m in matches[:10]
    ]

    return {
        "opponent_name": opponent_name,
        "tier": matches[0].opponent_tier,
        "total_games": total,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "winrate": round((wins / total) * 100, 1) if total else 0.0,
        "avg_round_diff": round(avg_rw - avg_rl, 2),
        "by_map": by_map,
        "pistol_pattern": pistol_pattern,
        "recent_matches": recent,
    }
