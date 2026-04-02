from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from core.analytics.player_stats import PlayerAnalyticsService
from uuid import UUID
from typing import Dict, Any

router = APIRouter()

@router.get("/player/{player_id}/death-order")
def get_player_death_order(player_id: UUID, db: Session = Depends(get_db)):
    """Obtiene analiticas de orden de muerte para un jugador."""
    service = PlayerAnalyticsService(db)
    stats = service.get_death_order_stats(player_id)
    if "error" in stats:
        # If no API data, we return mock/zero for UI stability or let frontend handle
        return {"success": False, "data": stats}
    return {"success": True, "data": stats}

@router.get("/player/{player_id}/benchmarks")
def get_player_benchmarks(player_id: UUID, db: Session = Depends(get_db)):
    """Obtiene benchmarks vs pro level por rol."""
    service = PlayerAnalyticsService(db)
    return service.get_role_benchmarks(player_id)
