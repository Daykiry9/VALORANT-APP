from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from core.auth.current_user import AuthContext, get_current_user
from database import get_db
import models
from schemas import MatchOut, ScrimCreate
from services.ocr_service import process_scoreboard_image

router = APIRouter()


@router.post("/upload-scoreboard")
async def upload_scoreboard(
    file: UploadFile = File(...),
    _: AuthContext = Depends(get_current_user),
):
    contents = await file.read()
    return process_scoreboard_image(contents)


@router.post("/")
def create_scrim(
    scrim: ScrimCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = scrim.team_id or auth.require_team()

    db_match = models.Match(
        team_id=team_id,
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
        data_source="ocr",
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)

    for row in scrim.players_data:
        db_player = (
            db.query(models.Player)
            .filter(
                models.Player.display_name == row.display_name,
                models.Player.team_id == team_id,
            )
            .first()
        )
        if not db_player:
            db_player = models.Player(
                display_name=row.display_name,
                team_id=team_id,
                role_inferred=True,
                rso_linked=False,
            )
            db.add(db_player)
            db.commit()
            db.refresh(db_player)

        db.add(models.MatchPlayerStat(
            match_id=db_match.id,
            player_id=db_player.id,
            agent=row.agent,
            acs=int(row.acs or 0),
            kills=int(row.kills or 0),
            deaths=int(row.deaths or 0),
            assists=int(row.assists or 0),
            first_bloods=int(row.first_bloods or 0),
            first_deaths=int(row.first_deaths or 0),
            hs_pct=float(row.hs_pct or 0),
            kast_pct=float(row.kast_pct or 0),
            adr=float(row.adr or 0),
            plants=int(row.plants or 0),
            defuses=int(row.defuses or 0),
        ))

    db.commit()

    # Invalidate analytics cache for this team.
    from core.cache import invalidate_team
    invalidate_team(team_id)

    return {"success": True, "match_id": str(db_match.id)}


@router.get("/", response_model=List[MatchOut])
def get_scrims(
    limit: int = 50,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    team_id = auth.require_team()
    return (
        db.query(models.Match)
        .filter(models.Match.type == "scrim", models.Match.team_id == team_id)
        .order_by(models.Match.date.desc())
        .limit(limit)
        .all()
    )
