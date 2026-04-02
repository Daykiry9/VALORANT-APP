import os
import requests
from sqlalchemy.orm import Session
import models

RIOT_API_KEY = os.environ.get("RIOT_API_KEY", "")
REGION = "na" # Could be dynamic

def get_match_by_id(match_id: str, db: Session):
    # Check cache
    existing_match = db.query(models.Match).filter(models.Match.vod_link == f"riot:{match_id}").first()
    if existing_match:
        return existing_match
        
    url = f"https://{REGION}.api.riotgames.com/val/match/v1/matches/{match_id}"
    headers = {"X-Riot-Token": RIOT_API_KEY}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        db_match = models.Match(
            type="official",
            date=None, # parse from token
            map=data["matchInfo"]["mapId"],
            result="W", # mock calculate
            team_score=0,
            opponent_score=0,
            opponent_name="Unknown",
            composition="",
            vod_link=f"riot:{match_id}",
            source="api"
        )
        db.add(db_match)
        db.commit()
        db.refresh(db_match)
        return db_match
    else:
        return None
