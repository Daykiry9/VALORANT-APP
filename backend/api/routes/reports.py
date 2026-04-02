from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from core.reports.pdf_generator import MatchReportGenerator
from core.auth.plan_gate import require_premium
from uuid import UUID
import os

router = APIRouter()

@router.get("/match/{match_id}/pdf")
async def export_match_report(
    match_id: UUID, 
    db: Session = Depends(get_db),
    # plan: bool = Depends(require_premium) # Descomentar para activar gating real
):
    """
    Exporta el reporte táctico de una partida en PDF. (Requiere plan Rising+)
    """
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Adaptar datos para el generador
    match_data = {
        "id": str(match.id),
        "map_name": match.map_name or "Unknown",
        "result": match.result or "D",
        "score": f"{match.team_rounds_won} - {match.team_rounds_lost}",
        "date": match.date.strftime("%Y-%m-%d") if match.date else "2024-03-24",
        "players": [
             {"name": p.player_id, "agent": p.agent, "acs": p.acs, "kda": f"{p.kills}/{p.deaths}/{p.assists}"}
             for p in match.player_stats[:5]
        ],
        "ai_insight": match.notes or "AI Briefing Pending. Use the 'Generate Tactical Briefing' feature in the War Room dashboard."
    }

    generator = MatchReportGenerator()
    file_path = generator.generate_match_summary_pdf(match_data)
    
    return FileResponse(
        path=file_path, 
        filename=f"VAL_Report_{match.map_name}_{match.id}.pdf",
        media_type="application/pdf"
    )
