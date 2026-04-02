from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter()

@router.get("/")
def get_players(db: Session = Depends(get_db)):
    return db.query(models.Player).all()

@router.post("/")
def create_player(display_name: str, riot_id: str, role: str, team_id: str = None, db: Session = Depends(get_db)):
    player = models.Player(display_name=display_name, riot_id=riot_id, role=role, team_id=team_id)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player
