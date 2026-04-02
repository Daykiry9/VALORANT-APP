from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ScrimCreate(BaseModel):
    team_id: Optional[UUID] = None
    match_date: datetime
    vod_link: Optional[str] = None
    opponent_name: str
    opponent_tier: Optional[str] = None
    map_name: str
    result: str # W / L / D
    team_rounds_won: int
    team_rounds_lost: int
    defense_rounds_won: Optional[int] = 0
    attack_rounds_won: Optional[int] = 0
    def_pistol: Optional[str] = None
    att_pistol: Optional[str] = None
    composition: str
    notes: Optional[str] = None
    
    # Pre-calculated player OCR data
    players_data: List[dict] # Custom dictionary from frontend
