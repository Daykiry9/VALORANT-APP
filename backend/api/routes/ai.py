from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from core.ai.insights import MatchAIInsightService
from uuid import UUID

router = APIRouter()

@router.post("/match/{match_id}/insights")
async def get_match_insights(match_id: UUID, db: Session = Depends(get_db)):
    """
    Genera y/o recupera insights de AI para una partida específica.
    """
    # 1. Verificar si la partida ya tiene notas generadas por AI (opcional cacheo en DB)
    # Por ahora generamos en tiempo real si se solicita.
    
    service = MatchAIInsightService(db)
    insight = await service.generate_match_feedback(str(match_id))
    
    # Podríamos guardar el insight en match.notes o un campo dedicado
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if match:
        match.notes = (match.notes or "") + "\n\n--- AI INSIGHT ---\n" + insight
        db.commit()
    
    return {"success": True, "insight": insight}
