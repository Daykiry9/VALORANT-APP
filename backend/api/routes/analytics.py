"""Analytics endpoints: player + team aggregates, benchmarks, comparison."""
from __future__ import annotations

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.ai.config import is_enabled
from core.ai.prompts.tryout_verdict import generate_tryout_verdict
from core.analytics.benchmarks import compute_role_benchmarks
from core.analytics.comparison import compare_players
from core.analytics.player_aggregates import (
    player_by_agent,
    player_by_map,
    player_summary,
    player_trend,
)
from core.analytics.player_stats import PlayerAnalyticsService
from core.analytics.team_aggregates import (
    team_composition_performance,
    team_map_pool,
    team_opponent_tier,
    team_side_winrate,
    team_summary,
)
from core.auth.current_user import AuthContext, get_current_user
from core.errors import Forbidden, NotFound
from database import get_db
import models
from schemas import (
    ComparePlayersRequest,
    ComparePlayersResponse,
    CompositionRow,
    DeathOrderStats,
    MapPoolRow,
    OpponentTierRow,
    PlayerByAgentRow,
    PlayerByMapRow,
    PlayerSummary,
    PlayerTrendPoint,
    RoleBenchmark,
    SideWinrate,
    TeamSummary,
    TryoutVerdict,
)

log = logging.getLogger(__name__)
router = APIRouter()


def _ensure_player_in_team(db: Session, player_id: UUID, team_id: UUID) -> models.Player:
    player = (
        db.query(models.Player)
        .filter(models.Player.id == player_id, models.Player.team_id == team_id)
        .first()
    )
    if not player:
        raise NotFound("Player not found in your team.")
    return player


# ---------- Player ----------

@router.get("/player/{player_id}/summary", response_model=PlayerSummary)
def get_player_summary(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    _ensure_player_in_team(db, player_id, team_id)
    return player_summary(db, player_id, team_id)


@router.get("/player/{player_id}/by-agent", response_model=List[PlayerByAgentRow])
def get_player_by_agent(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    _ensure_player_in_team(db, player_id, team_id)
    return player_by_agent(db, player_id, team_id)


@router.get("/player/{player_id}/by-map", response_model=List[PlayerByMapRow])
def get_player_by_map(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    _ensure_player_in_team(db, player_id, team_id)
    return player_by_map(db, player_id, team_id)


@router.get("/player/{player_id}/trend", response_model=List[PlayerTrendPoint])
def get_player_trend(
    player_id: UUID,
    window: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    _ensure_player_in_team(db, player_id, team_id)
    return player_trend(db, player_id, team_id, window=window)


@router.get("/player/{player_id}/death-order", response_model=DeathOrderStats)
def get_player_death_order(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    _ensure_player_in_team(db, player_id, team_id)
    stats = PlayerAnalyticsService(db).get_death_order_stats(player_id)
    if "error" in stats:
        # Round-event data not populated yet — return zeros so UI can render placeholders.
        return DeathOrderStats(
            total_rounds=0, first_death_rate=0, first_blood_rate=0,
            survival_rate=0, fd_count=0, fb_count=0,
        )
    return DeathOrderStats(**stats)


@router.get("/player/{player_id}/benchmarks", response_model=RoleBenchmark)
def get_player_benchmarks(
    player_id: UUID,
    tier: str = Query("T1"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    player = _ensure_player_in_team(db, player_id, team_id)
    return compute_role_benchmarks(db, player.role or "flex", tier=tier)


# ---------- Team ----------

def _assert_team(auth: AuthContext, team_id: UUID) -> UUID:
    my_team = auth.require_team()
    if team_id != my_team:
        raise Forbidden("You can only read your own team's analytics.")
    return my_team


@router.get("/team/{team_id}/summary", response_model=TeamSummary)
def get_team_summary(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_team(auth, team_id)
    return team_summary(db, team_id)


@router.get("/team/{team_id}/map-pool", response_model=List[MapPoolRow])
def get_team_map_pool(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_team(auth, team_id)
    return team_map_pool(db, team_id)


@router.get("/team/{team_id}/side-winrate", response_model=SideWinrate)
def get_team_side_winrate(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_team(auth, team_id)
    return team_side_winrate(db, team_id)


@router.get("/team/{team_id}/composition", response_model=List[CompositionRow])
def get_team_composition(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_team(auth, team_id)
    return team_composition_performance(db, team_id)


@router.get("/team/{team_id}/opponent-tier", response_model=List[OpponentTierRow])
def get_team_opponent_tier(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_team(auth, team_id)
    return team_opponent_tier(db, team_id)


# ---------- Compare ----------

@router.post("/compare", response_model=ComparePlayersResponse)
def compare(
    payload: ComparePlayersRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    for pid in payload.player_ids:
        _ensure_player_in_team(db, pid, team_id)

    result = compare_players(db, team_id, payload.player_ids)

    verdict: TryoutVerdict | None = None
    if is_enabled():
        try:
            verdict = generate_tryout_verdict(result)
        except Exception as e:
            log.warning("Tryout verdict generation failed: %s", e)

    return ComparePlayersResponse(
        players=result["players"],
        diffs=[{
            "metric": d["metric"],
            "values": d["values"],
            "delta_vs_best": d["delta_vs_best"],
        } for d in result["diffs"]],
        verdict=verdict,
    )
