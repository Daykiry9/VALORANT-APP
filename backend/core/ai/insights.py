import os
import logging
from sqlalchemy.orm import Session
import google.generativeai as genai
import models
from typing import Optional

logger = logging.getLogger(__name__)

# Configuración de Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class MatchAIInsightService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_match_feedback(self, match_id: str) -> str:
        """
        Genera feedback táctico basado en los datos de la partida usando Gemini AI.
        """
        match = self.db.query(models.Match).filter(models.Match.id == match_id).first()
        if not match:
            return "Error: Partida no encontrada en la base de datos."

        if not GEMINI_API_KEY:
            return self._get_mock_feedback(match)

        try:
            # Construir prompt táctico "War Room"
            prompt = self._build_tactical_prompt(match)
            
            # Inicializar modelo
            model = genai.GenerativeModel(MODEL_NAME)
            
            # Generar contenido
            # Nota: Usamos una configuración de sistema sugerida para el tono
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=500,
                )
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error calling Gemini AI: {e}")
            return f"Error en la generación de AI: {str(e)}. Fallback al análisis básico."

    def _build_tactical_prompt(self, match: models.Match) -> str:
        players_stats = ""
        for p in match.player_stats:
            agent_name = p.agent or "Desconocido"
            players_stats += f"- Jugador {p.id}: Agente: {agent_name}, ACS: {p.acs}, KDA: {p.kills}/{p.deaths}/{p.assists}, FB: {p.first_bloods}\n"

        prompt = f"""
        ACTÚA COMO ANALISTA PRO DE VALORANT (TACTICAL WAR ROOM).
        Analiza esta partida en el mapa {match.map_name or 'desconocido'}.
        Resultado: {match.team_rounds_won} - {match.team_rounds_lost} ({match.result})
        
        Estadísticas de Jugadores:
        {players_stats}
        
        TAREA:
        1. Identifica la debilidad táctica (¿Falta de agresividad en FB?, ¿Baja supervivencia?).
        2. Menciona el jugador con mayor impacto táctico basado en ACS y FB.
        3. Sugiere una mejora para la gestión económica o de mapa.
        
        FORMATO: Markdown conciso, tono militar/competitivo, máximo 150 palabras.
        """
        return prompt

    def _get_mock_feedback(self, match: models.Match) -> str:
        # Fallback si no hay API KEY
        if match.result == 'W':
            return f"### Victoria en {match.map_name}\nExcelentes entradas. Tu ratio de FB sugiere dominio del espacio. Sugerencia: Refinar retakes para asegurar rounds flawless."
        else:
            return f"### Derrota en {match.map_name}\nVulnerabilidad detectada en defensa. Falta de control en zonas clave del mapa. Revisar el posicionamiento de centinelas."
