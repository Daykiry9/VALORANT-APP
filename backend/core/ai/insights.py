import google.generativeai as genai
import os
import logging
from sqlalchemy.orm import Session
import models

logger = logging.getLogger(__name__)

def configure_genai():
    key = os.getenv("GEMINI_API_KEY")
    if key:
        genai.configure(api_key=key)

class MatchAIInsightService:
    def __init__(self, db: Session):
        self.db = db
        configure_genai()

    async def generate_match_feedback(self, match_id: str) -> str:
        match = self.db.query(models.Match).filter(
            models.Match.id == match_id
        ).first()
        if not match:
            return "Error: Partida no encontrada."
        
        if not os.getenv("GEMINI_API_KEY"):
            return self._mock_feedback(match)

        stats = self.db.query(models.MatchPlayerStat).filter(
            models.MatchPlayerStat.match_id == match.id
        ).all()

        players_text = "\n".join([
            f"- Agente: {s.agent or 'N/A'}, ACS: {s.acs or 0}, "
            f"K/D/A: {s.kills or 0}/{s.deaths or 0}/{s.assists or 0}, "
            f"FB: {s.first_bloods or 0}, FD: {s.first_deaths or 0}, "
            f"KAST: {s.kast_pct or 0}%, ADR: {s.adr or 0}"
            for s in stats
        ])

        prompt = f"""Eres un analista pro de Valorant. Analiza esta partida y da insights tácticos accionables en español.

Mapa: {match.map_name or 'Desconocido'}
Resultado: {match.team_rounds_won or 0} - {match.team_rounds_lost or 0} ({match.result or 'D'})
Rival: {match.opponent_name or 'Desconocido'} ({match.opponent_tier or 'N/A'})
Fuente: {match.data_source or 'manual'}

Stats del equipo:
{players_text or 'Sin datos de jugadores disponibles.'}

Responde con exactamente estas 3 secciones en markdown:
### ⚡ Problema Principal
(La debilidad táctica más importante que costó rondas)

### 🎯 Jugador Destacado
(El jugador con mayor impacto y por qué, basado en ACS y FB)

### 📋 Acción para el Próximo Scrim
(Una recomendación concreta y ejecutable para mejorar)

Máximo 160 palabras total. Tono: analista de guerra, directo, sin rodeos."""

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._mock_feedback(match)

    def _mock_feedback(self, match: models.Match) -> str:
        if match.result == 'W':
            return f"### ⚡ Buen trabajo\nVictoria sólida en {match.map_name}. Configura tu GEMINI_API_KEY para insights detallados."
        return f"### ⚡ Área de mejora\nDerrota en {match.map_name}. Analiza los pistol rounds. Configura tu GEMINI_API_KEY para insights completos."
