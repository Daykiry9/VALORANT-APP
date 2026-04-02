from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from services.riot_api import get_match_by_id

router = APIRouter()

@router.get("/{match_id}")
def fetch_riot_match(match_id: str, db: Session = Depends(get_db)):
    match = get_match_by_id(match_id, db)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found or Riot API error")
    return match
