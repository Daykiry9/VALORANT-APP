from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.auth.current_user import AuthContext, get_current_user
from core.errors import NotFound
from database import get_db
import models
from schemas import TeamCreate, TeamOut

router = APIRouter()


@router.get("/", response_model=List[TeamOut])
def get_teams(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Return teams visible to the current user (same org, or just their team)."""
    q = db.query(models.Team)
    if auth.org_id:
        q = q.filter(models.Team.org_id == auth.org_id)
    elif auth.team_id:
        q = q.filter(models.Team.id == auth.team_id)
    return q.all()


@router.get("/{team_id}", response_model=TeamOut)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise NotFound("Team not found.")
    return team


@router.post("/", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team = models.Team(name=payload.name, tag=payload.tag, region=payload.region, org_id=auth.org_id)
    db.add(team)
    db.commit()
    db.refresh(team)
    # Auto-attach creator if they have no team yet
    if not auth.team_id:
        user = db.query(models.User).filter(models.User.id == auth.user_id).first()
        if user:
            user.team_id = team.id
            user.org_id = team.org_id
            db.commit()
    return team
