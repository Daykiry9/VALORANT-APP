from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.ocr_service import process_scoreboard_image

router = APIRouter()

@router.post("/upload-scoreboard")
async def upload_scoreboard(file: UploadFile = File(...)):
    contents = await file.read()
    result = process_scoreboard_image(contents)
    return result

@router.post("/")
def create_scrim(scrim: schemas.ScrimCreate, db: Session = Depends(get_db)):
    db_match = models.Match(
        team_id=scrim.team_id,
        type="scrim",
        date=scrim.match_date,
        map_name=scrim.map_name,
        result=scrim.result,
        team_rounds_won=scrim.team_rounds_won,
        team_rounds_lost=scrim.team_rounds_lost,
        defense_rounds_won=scrim.defense_rounds_won,
        attack_rounds_won=scrim.attack_rounds_won,
        def_pistol=scrim.def_pistol,
        att_pistol=scrim.att_pistol,
        opponent_name=scrim.opponent_name,
        opponent_tier=scrim.opponent_tier,
        composition=scrim.composition,
        vod_link=scrim.vod_link,
        notes=scrim.notes,
        data_source="ocr"
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    
    # create player stats
    for pdata in scrim.players_data:
        player_name = pdata.get("name")
        # Lookup player or create unlinked stub
        db_player = db.query(models.Player).filter(models.Player.display_name == player_name).first()
        if not db_player:
            db_player = models.Player(display_name=player_name, team_id=scrim.team_id, role_inferred=True, rso_linked=False)
            db.add(db_player)
            db.commit()
            db.refresh(db_player)

        db_stat = models.MatchPlayerStat(
            match_id=db_match.id,
            player_id=db_player.id,
            agent=pdata.get("agent"),
            acs=float(pdata.get("acs", 0) or 0),
            kills=int(pdata.get("kills", 0) or 0),
            deaths=int(pdata.get("deaths", 0) or 0),
            assists=int(pdata.get("assists", 0) or 0),
            first_bloods=int(pdata.get("fb", 0) or 0),
            first_deaths=int(pdata.get("fd", 0) or 0),
            hs_pct=float(str(pdata.get("hs_pct", "0")).replace("%", "")),
            kast_pct=float(str(pdata.get("kast", "0")).replace("%", "")),
            adr=float(pdata.get("adr", 0) or 0)
        )
        db.add(db_stat)
    
    db.commit()
    return {"success": True, "match_id": db_match.id}

@router.get("/")
def get_scrims(db: Session = Depends(get_db), limit: int = 50):
    return db.query(models.Match).filter(models.Match.type == "scrim").limit(limit).all()
