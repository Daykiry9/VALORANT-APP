from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.auth.current_user import AuthContext, get_current_user
from core.auth.plan_gate import check_plan_access
from core.errors import Forbidden, NotFound
from core.reports.pdf_generator import MatchReportGenerator
from database import get_db
import models

router = APIRouter()


@router.get("/match/{match_id}/pdf")
async def export_match_report(
    match_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
):
    """Export tactical PDF. Requires plan >= rising."""
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise NotFound("Match not found.")
    if match.team_id != auth.require_team():
        raise Forbidden("Match belongs to a different team.")

    check_plan_access("rising", match.team_id, db)

    stats = db.query(models.MatchPlayerStat).filter(models.MatchPlayerStat.match_id == match.id).limit(5).all()

    # Latest match_tactical insight, if any
    latest_insight = (
        db.query(models.MatchInsight)
        .filter(
            models.MatchInsight.match_id == match.id,
            models.MatchInsight.prompt_type == "match_tactical",
        )
        .order_by(models.MatchInsight.version.desc())
        .first()
    )
    ai_insight = ""
    if latest_insight and latest_insight.content_json:
        c = latest_insight.content_json
        ai_insight = (
            f"Problem: {c.get('main_problem', '')}\n\n"
            f"Standout: {c.get('standout_player', '')}\n\n"
            f"Next action: {c.get('next_action', '')}"
        )
    else:
        ai_insight = "No AI briefing generated yet. Run 'Generate Tactical Briefing' first."

    match_data = {
        "id": str(match.id),
        "map_name": match.map_name or "Unknown",
        "result": match.result or "D",
        "score": f"{match.team_rounds_won or 0} - {match.team_rounds_lost or 0}",
        "date": match.date.strftime("%Y-%m-%d") if match.date else "",
        "players": [
            {
                "name": str(p.player_id),
                "agent": p.agent,
                "acs": p.acs,
                "kda": f"{p.kills}/{p.deaths}/{p.assists}",
            }
            for p in stats
        ],
        "ai_insight": ai_insight,
    }

    generator = MatchReportGenerator()
    file_path = generator.generate_match_summary_pdf(match_data)

    return FileResponse(
        path=file_path,
        filename=f"VAL_Report_{match.map_name}_{match.id}.pdf",
        media_type="application/pdf",
    )
