from sqlalchemy.orm import Session
from .client import RiotAPIClient
import models
import logging
from typing import List, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class MatchSyncService:
    def __init__(self, db: Session, client: RiotAPIClient):
        self.db = db
        self.client = client

    async def sync_custom_games(self, player_puuid: str, team_id: str):
        """
        Pull y procesa partidas personalizadas (scrims via API) para un PUUID.
        1. GET matchlist
        2. Filter CustomGame
        3. Fetch Match Details
        4. Save to DB Match + MatchPlayerStats
        """
        matchlist = await self.client.get_matchlist(player_puuid)
        if not matchlist or "history" not in matchlist:
            logger.info(f"No match history found for PUUID: {player_puuid}")
            return
            
        custom_games = [m for m in matchlist["history"] if m.get("provisioningFlowID") == "CustomGame"]
        logger.info(f"Found {len(custom_games)} custom games in history for {player_puuid}")
        
        for match_ref in custom_games:
            match_id = match_ref["matchId"]
            
            # 1. Verificar cache / existencia
            existing = self.db.query(models.Match).filter(models.Match.riot_match_id == match_id).first()
            if existing:
                continue
            
            # 2. Fetch match details
            match_data = await self.client.get_match(match_id)
            if not match_data:
                continue
            
            metadata = match_data.get("matchInfo", {})
            
            # 3. Mapear metadatos a Match model
            db_match = models.Match(
                team_id=team_id,
                riot_match_id=match_id,
                type="custom",
                date=datetime.fromtimestamp(metadata.get("gameStartMillis", 0) / 1000),
                map_id=metadata.get("mapId"),
                map_name=self._map_id_to_name(metadata.get("mapId")),
                data_source="api",
                api_fetched=True
            )
            
            # Procesar Scores (Team A vs Team B)
            # Nota: Lógica simplificada para determinar el resultado del equipo del usuario
            teams = match_data.get("teams", [])
            players_data = match_data.get("players", [])
            
            # Determinar a qué equipo pertenece el usuario
            user_team_id = next((p["teamId"] for p in players_data if p["puuid"] == player_puuid), None)
            if not user_team_id: continue
            
            user_team = next((t for t in teams if t["teamId"] == user_team_id), {})
            enemy_team = next((t for t in teams if t["teamId"] != user_team_id), {})
            
            db_match.team_rounds_won = user_team.get("roundsWon", 0)
            db_match.team_rounds_lost = enemy_team.get("roundsWon", 0)
            db_match.result = "W" if user_team.get("won") else "L" if enemy_team.get("won") else "D"
            
            self.db.add(db_match)
            self.db.flush() # Para tener el id autogenerado
            
            # 4. Procesar Stats individuales
            for p in players_data:
                stats = p.get("stats", {})
                
                # Buscar si el jugador existe en plataforma
                db_p = self.db.query(models.Player).filter(models.Player.puuid == p["puuid"]).first()
                
                player_stat = models.MatchPlayerStat(
                    match_id=db_match.id,
                    player_id=db_p.id if db_p else None,
                    agent=p.get("characterId"), # ID interno del agente
                    acs=int(stats.get("score", 0) / max(1, metadata.get("gameLengthMillis", 0)/1000/60)), # Aproximado si no viene directo
                    kills=stats.get("kills", 0),
                    deaths=stats.get("deaths", 0),
                    assists=stats.get("assists", 0),
                    score=stats.get("score", 0)
                )
                self.db.add(player_stat)
                
            self.db.commit()
            logger.info(f"Sincronizada partida {match_id} (API)")

    def _map_id_to_name(self, map_id: str) -> str:
        """Helper para convertir IDs de mapa de Riot a nombres comunes"""
        mapping = {
            "/Game/Maps/Triad/Triad": "Haven",
            "/Game/Maps/Bonsai/Bonsai": "Split",
            "/Game/Maps/Ascent/Ascent": "Ascent",
            "/Game/Maps/Duality/Duality": "Bind",
            "/Game/Maps/Port/Port": "Icebox",
            "/Game/Maps/Foxtrot/Foxtrot": "Breeze",
            "/Game/Maps/Canyon/Canyon": "Fracture",
            "/Game/Maps/Jam/Jam": "Lotus",
            "/Game/Maps/Jungle/Jungle": "Sunset",
            "/Game/Maps/Poveglia/Poveglia": "Pearl"
        }
        return mapping.get(map_id, "Unknown Map")
