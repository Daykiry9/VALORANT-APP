from sqlalchemy.orm import Session
from sqlalchemy import func, case
import models
from typing import Dict, Any, List
from uuid import UUID

class PlayerAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_death_order_stats(self, player_id: UUID) -> Dict[str, Any]:
        """
        Calcula estadísticas de orden de muerte para un jugador:
        - FD Rate (First Death)
        - Survival Rate
        - Trade Rate
        - Clutch Conversion
        """
        # 1. Total de rondas jugadas en partidas con datos de eventos
        # Buscamos eventos donde el jugador sea actor o víctima
        total_rounds = self.db.query(models.RoundEvent.round_id)\
            .filter((models.RoundEvent.actor_player_id == player_id) | (models.RoundEvent.victim_player_id == player_id))\
            .distinct().count()
            
        if total_rounds == 0:
            return {"error": "No API data available for this player"}

        # 2. First Deaths
        first_deaths = self.db.query(models.RoundEvent)\
            .filter(models.RoundEvent.victim_player_id == player_id)\
            .filter(models.RoundEvent.is_first_death == True).count()

        # 3. First Bloods
        first_bloods = self.db.query(models.RoundEvent)\
            .filter(models.RoundEvent.actor_player_id == player_id)\
            .filter(models.RoundEvent.is_first_blood == True).count()

        # 4. Survival Rate
        # Rondas donde no murió
        deaths_count = self.db.query(models.RoundEvent.round_id)\
            .filter(models.RoundEvent.victim_player_id == player_id).distinct().count()
        
        survival_rate = ((total_rounds - deaths_count) / total_rounds) * 100 if total_rounds > 0 else 0

        # 5. Clutch Stats
        # Oportunidades: veces que fue el último vivo (esto requiere lógica más compleja de eventos por ronda)
        # Por ahora calculamos métricas básicas
        
        return {
            "total_rounds": total_rounds,
            "first_death_rate": (first_deaths / total_rounds) * 100 if total_rounds > 0 else 0,
            "first_blood_rate": (first_bloods / total_rounds) * 100 if total_rounds > 0 else 0,
            "survival_rate": survival_rate,
            "fd_count": first_deaths,
            "fb_count": first_bloods
        }

    def get_role_benchmarks(self, player_id: UUID) -> List[Dict[str, Any]]:
        """
        Retorna benchmarks vs VCT Pro level para el rol del jugador.
        Datos hardcodeados según Sprint 3.6.
        """
        player = self.db.query(models.Player).filter(models.Player.id == player_id).first()
        if not player: return []
        
        role = player.role or "duelist"
        # Benchmarks ficticios (basados en pro avg reales de VCT)
        benchmarks = {
            "duelist": {"acs": 265, "kd": 1.4, "kast": 74, "fb_rate": 22},
            "initiator": {"acs": 210, "kd": 1.1, "kast": 78, "fb_rate": 12},
            "controller": {"acs": 190, "kd": 1.0, "kast": 80, "fb_rate": 8},
            "sentinel": {"acs": 200, "kd": 1.2, "kast": 75, "fb_rate": 10},
        }
        
        target = benchmarks.get(role.lower(), benchmarks["duelist"])
        return [
            {"metric": "ACS", "pro": target["acs"]},
            {"metric": "K/D", "pro": target["kd"]},
            {"metric": "KAST%", "pro": target["kast"]},
            {"metric": "FB Rate", "pro": target["fb_rate"]},
        ]
