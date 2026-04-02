from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from uuid import UUID

def check_plan_access(required_plan: str, team_id: UUID, db: Session):
    """
    Verifica si el equipo tiene el plan necesario para acceder a una feature.
    Planes: free < rising < premier < franchise
    """
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    
    plan_hierarchy = {
        'free': 0,
        'rising': 1,
        'premier': 2,
        'franchise': 3
    }
    
    current_plan_level = plan_hierarchy.get(team.plan.lower(), 0)
    required_plan_level = plan_hierarchy.get(required_plan.lower(), 0)
    
    if current_plan_level < required_plan_level:
        raise HTTPException(
            status_code=403, 
            detail=f"Feature locked. Required plan: {required_plan.upper()}. Your plan: {team.plan.upper()}"
        )
    
    return True

# Dependency for routes
async def require_premium(team_id: UUID, db: Session = Depends(get_db)):
    """Requiere al menos el plan RISING."""
    return check_plan_access('rising', team_id, db)

async def require_pro(team_id: UUID, db: Session = Depends(get_db)):
    """Requiere al menos el plan PREMIER."""
    return check_plan_access('premier', team_id, db)
