from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.auth.current_user import AuthContext, get_current_user
from core.errors import Forbidden, NotFound
from database import get_db
import models
from schemas import PlayerCreate, PlayerOut, PlayerUpdate

router = APIRouter()


def _assert_player_in_team(db: Session, player_id: UUID, team_id: UUID) -> models.Player:
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise NotFound("Player not found.")
    if player.team_id != team_id:
        raise Forbidden("Player belongs to a different team.")
    return player


@router.get("/", response_model=List[PlayerOut])
def get_players(
    is_tryout: Optional[str] = Query(None, description="true | false | all"),
    team_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """List players for the caller's team. `is_tryout` filters: 'true', 'false', 'all' (default: 'false')."""
    effective_team = team_id or auth.team_id
    if not effective_team:
        return []
    q = db.query(models.Player).filter(models.Player.team_id == effective_team)
    flag = (is_tryout or "false").lower()
    if flag == "true":
        q = q.filter(models.Player.is_tryout == True)  # noqa: E712
    elif flag == "false":
        q = q.filter(models.Player.is_tryout == False)  # noqa: E712
    return q.order_by(models.Player.display_name).all()


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    return _assert_player_in_team(db, player_id, auth.require_team())


@router.post("/", response_model=PlayerOut)
def create_player(
    payload: PlayerCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = payload.team_id or auth.require_team()
    player = models.Player(
        team_id=team_id,
        display_name=payload.display_name,
        riot_id=payload.riot_id,
        role=payload.role,
        is_tryout=payload.is_tryout,
        role_inferred=False,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.patch("/{player_id}", response_model=PlayerOut)
def update_player(
    player_id: UUID,
    payload: PlayerUpdate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    player = _assert_player_in_team(db, player_id, auth.require_team())
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(player, field, value)
    if payload.role is not None:
        player.role_inferred = False
    db.commit()
    db.refresh(player)
    return player


@router.patch("/{player_id}/promote", response_model=PlayerOut)
def promote_to_main(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Move a player from tryout pool into the main roster."""
    player = _assert_player_in_team(db, player_id, auth.require_team())
    player.is_tryout = False
    db.commit()
    db.refresh(player)
    return player


@router.patch("/{player_id}/demote", response_model=PlayerOut)
def demote_to_tryout(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Move a player back to tryout pool."""
    player = _assert_player_in_team(db, player_id, auth.require_team())
    player.is_tryout = True
    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}")
def delete_player(
    player_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    player = _assert_player_in_team(db, player_id, auth.require_team())
    db.delete(player)
    db.commit()
    return {"success": True}
