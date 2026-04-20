"""AI endpoints: match tactical insight, player weakness, composition read, insight history.

All insights are persisted to `match_insights` (versioned). Callers receive
the latest version; history is available via `/insights/history`.
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.ai.config import is_enabled, model_name
from core.ai.prompts.composition import generate_composition_read
from core.ai.prompts.match_tactical import generate_match_insight
from core.ai.prompts.player_weakness import generate_player_weakness_report
from core.auth.current_user import AuthContext, get_current_user
from core.errors import NotFound, UpstreamError
from database import get_db
import models
from schemas import (
    CompositionRead,
    MatchInsightContent,
    MatchInsightOut,
    PlayerWeaknessReport,
)

log = logging.getLogger(__name__)
router = APIRouter()


def _assert_match_in_team(db: Session, match_id: UUID, team_id: UUID) -> models.Match:
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise NotFound("Match not found.")
    if match.team_id != team_id:
        from core.errors import Forbidden
        raise Forbidden("Match belongs to a different team.")
    return match


def _next_version(db: Session, match_id: UUID, prompt_type: str) -> int:
    last = (
        db.query(models.MatchInsight)
        .filter(
            models.MatchInsight.match_id == match_id,
            models.MatchInsight.prompt_type == prompt_type,
        )
        .order_by(models.MatchInsight.version.desc())
        .first()
    )
    return (last.version + 1) if last else 1


def _persist_match_insight(
    db: Session,
    match_id: UUID,
    prompt_type: str,
    content: dict,
    user_id: UUID,
) -> models.MatchInsight:
    payload_hash = hashlib.sha256(
        json.dumps({"match_id": str(match_id), "prompt_type": prompt_type}, sort_keys=True).encode()
    ).hexdigest()
    row = models.MatchInsight(
        match_id=match_id,
        prompt_type=prompt_type,
        version=_next_version(db, match_id, prompt_type),
        model=model_name(),
        content_json=content,
        prompt_hash=payload_hash,
        generated_by_user_id=user_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _row_to_out(row: models.MatchInsight) -> MatchInsightOut:
    content = MatchInsightContent(**(row.content_json or {}))
    return MatchInsightOut(
        id=row.id,
        match_id=row.match_id,
        prompt_type=row.prompt_type,
        version=row.version,
        model=row.model,
        content=content,
        generated_at=row.generated_at,
    )


# ---------- Match tactical insight ----------

@router.post("/match/{match_id}/insights", response_model=MatchInsightOut)
async def generate_match_tactical_insight(
    match_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Generate a new tactical insight for a match. Persists a new version and returns it."""
    _assert_match_in_team(db, match_id, auth.require_team())

    if not is_enabled():
        raise UpstreamError("Gemini API key not configured. Set GEMINI_API_KEY to generate insights.")

    content = generate_match_insight(db, str(match_id))
    row = _persist_match_insight(
        db, match_id, "match_tactical", content.model_dump(), auth.user_id
    )
    return _row_to_out(row)


@router.get("/match/{match_id}/insights", response_model=MatchInsightOut)
def get_latest_match_insight(
    match_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_match_in_team(db, match_id, auth.require_team())
    row = (
        db.query(models.MatchInsight)
        .filter(
            models.MatchInsight.match_id == match_id,
            models.MatchInsight.prompt_type == "match_tactical",
        )
        .order_by(models.MatchInsight.version.desc())
        .first()
    )
    if not row:
        raise NotFound("No insight generated yet for this match.")
    return _row_to_out(row)


@router.get("/match/{match_id}/insights/history", response_model=List[MatchInsightOut])
def get_match_insight_history(
    match_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    _assert_match_in_team(db, match_id, auth.require_team())
    rows = (
        db.query(models.MatchInsight)
        .filter(models.MatchInsight.match_id == match_id)
        .order_by(models.MatchInsight.generated_at.desc())
        .all()
    )
    return [_row_to_out(r) for r in rows]


# ---------- Player weakness ----------

@router.get("/player/{player_id}/weakness-report", response_model=PlayerWeaknessReport)
def get_player_weakness_report(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Fresh AI-generated weakness report (not persisted — player-level history deferred)."""
    if not is_enabled():
        raise UpstreamError("Gemini API key not configured.")
    return generate_player_weakness_report(db, player_id, auth.require_team())


# ---------- Composition ----------

@router.get("/team/{team_id}/composition-read", response_model=CompositionRead)
def get_composition_read(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    if team_id != auth.require_team():
        from core.errors import Forbidden
        raise Forbidden("You can only read your own team's composition.")
    if not is_enabled():
        raise UpstreamError("Gemini API key not configured.")
    return generate_composition_read(db, team_id)
