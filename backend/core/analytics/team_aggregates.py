"""Team-level cross-match aggregations."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

import models
from core.cache import cached


def _win_streak_label(results_desc: List[str]) -> str:
    """Given last-N match results ordered newest-first, return streak like 'W3', 'L2'."""
    if not results_desc:
        return "-"
    head = (results_desc[0] or "").upper()
    if head not in ("W", "L"):
        return "-"
    n = 0
    for r in results_desc:
        if (r or "").upper() == head:
            n += 1
        else:
            break
    return f"{head}{n}"


@cached(namespace="team_summary", ttl=300)
def team_summary(db: Session, team_id: UUID) -> dict:
    matches = (
        db.query(models.Match)
        .filter(models.Match.team_id == team_id)
        .order_by(models.Match.date.desc())
        .all()
    )

    if not matches:
        return {
            "team_id": str(team_id),
            "matches_played": 0, "wins": 0, "losses": 0, "draws": 0,
            "winrate": 0.0, "streak": "-",
            "avg_rounds_won": 0.0, "avg_rounds_lost": 0.0,
            "pistol_winrate": 0.0,
            "last_match_id": None,
        }

    wins = sum(1 for m in matches if (m.result or "").upper() == "W")
    losses = sum(1 for m in matches if (m.result or "").upper() == "L")
    draws = sum(1 for m in matches if (m.result or "").upper() == "D")
    total = len(matches)

    pistols_won = 0
    pistols_played = 0
    for m in matches:
        for p in (m.def_pistol, m.att_pistol):
            if p in ("W", "L"):
                pistols_played += 1
                if p == "W":
                    pistols_won += 1

    avg_won = sum(m.team_rounds_won or 0 for m in matches) / total
    avg_lost = sum(m.team_rounds_lost or 0 for m in matches) / total

    return {
        "team_id": str(team_id),
        "matches_played": total,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "winrate": round((wins / total) * 100, 1) if total else 0.0,
        "streak": _win_streak_label([m.result for m in matches]),
        "avg_rounds_won": round(avg_won, 2),
        "avg_rounds_lost": round(avg_lost, 2),
        "pistol_winrate": round((pistols_won / pistols_played) * 100, 1) if pistols_played else 0.0,
        "last_match_id": str(matches[0].id) if matches else None,
    }


@cached(namespace="team_map_pool", ttl=300)
def team_map_pool(db: Session, team_id: UUID) -> List[dict]:
    win_case = case((models.Match.result == "W", 1), else_=0)

    rows = (
        db.query(
            models.Match.map_name.label("map_name"),
            func.count(models.Match.id).label("games"),
            func.sum(win_case).label("wins"),
            func.avg(models.Match.team_rounds_won).label("rw"),
            func.avg(models.Match.team_rounds_lost).label("rl"),
        )
        .filter(models.Match.team_id == team_id)
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
            "avg_round_diff": round(float(r.rw or 0) - float(r.rl or 0), 2),
        })
    return result


@cached(namespace="team_side", ttl=300)
def team_side_winrate(db: Session, team_id: UUID) -> dict:
    matches = db.query(models.Match).filter(models.Match.team_id == team_id).all()

    att_won = sum(m.attack_rounds_won or 0 for m in matches)
    def_won = sum(m.defense_rounds_won or 0 for m in matches)
    total_won = sum(m.team_rounds_won or 0 for m in matches)
    total_lost = sum(m.team_rounds_lost or 0 for m in matches)

    att_lost = max(0, total_won + total_lost - att_won - def_won) // 2
    def_lost = att_lost
    att_played = att_won + att_lost
    def_played = def_won + def_lost

    return {
        "attack_rounds_won": att_won,
        "attack_rounds_played": att_played,
        "attack_winrate": round((att_won / att_played) * 100, 1) if att_played else 0.0,
        "defense_rounds_won": def_won,
        "defense_rounds_played": def_played,
        "defense_winrate": round((def_won / def_played) * 100, 1) if def_played else 0.0,
    }


@cached(namespace="team_composition", ttl=300)
def team_composition_performance(db: Session, team_id: UUID) -> List[dict]:
    win_case = case((models.Match.result == "W", 1), else_=0)

    rows = (
        db.query(
            models.Match.composition.label("composition"),
            func.count(models.Match.id).label("games"),
            func.sum(win_case).label("wins"),
        )
        .filter(models.Match.team_id == team_id)
        .filter(models.Match.composition.isnot(None))
        .group_by(models.Match.composition)
        .order_by(desc("games"))
        .limit(20)
        .all()
    )

    result = []
    for r in rows:
        games = int(r.games or 0)
        wins = int(r.wins or 0)
        result.append({
            "composition": r.composition or "",
            "games": games,
            "wins": wins,
            "winrate": round((wins / games) * 100, 1) if games else 0.0,
        })
    return result


@cached(namespace="team_tier", ttl=300)
def team_opponent_tier(db: Session, team_id: UUID) -> List[dict]:
    win_case = case((models.Match.result == "W", 1), else_=0)

    rows = (
        db.query(
            models.Match.opponent_tier.label("tier"),
            func.count(models.Match.id).label("games"),
            func.sum(win_case).label("wins"),
        )
        .filter(models.Match.team_id == team_id)
        .filter(models.Match.opponent_tier.isnot(None))
        .group_by(models.Match.opponent_tier)
        .order_by(models.Match.opponent_tier)
        .all()
    )

    return [
        {
            "tier": r.tier,
            "games": int(r.games or 0),
            "wins": int(r.wins or 0),
            "winrate": round((int(r.wins or 0) / int(r.games)) * 100, 1) if r.games else 0.0,
        }
        for r in rows
    ]
