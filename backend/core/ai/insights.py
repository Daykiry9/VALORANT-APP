import os
import logging
import json
from sqlalchemy.orm import Session
import google.generativeai as genai
import models
from typing import Optional

logger = logging.getLogger(__name__)

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configuration
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class MatchAIInsightService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_match_feedback(self, match_id: str) -> str:
        """
        Generates tactical feedback using Gemini 1.5 Flash (MVP Optimized).
        """
        match = self.db.query(models.Match).filter(models.Match.id == match_id).first()
        if not match:
            return "Error: Match not found in database."

        if not GEMINI_API_KEY:
            return "Error: Gemini API Key not configured."

        prompt = self._build_tactical_prompt(match)

        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            # Use sync or async as needed, flash is fast enough
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=600,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Error calling Gemini AI: {e}")
            return self._get_mock_feedback(match)

    def _build_tactical_prompt(self, match: models.Match) -> str:
        players_stats = ""
        for p in match.player_stats:
            agent_name = p.agent or "Unknown"
            players_stats += f"- Agent: {agent_name or '?'}, ACS: {p.acs or '0'}, KDA: {p.kills}/{p.deaths}/{p.assists}, FB: {p.first_bloods or 0}, FD: {p.first_deaths or 0}, KAST: {p.kast_pct or 0}%\n"

        return f"""
        YOU ARE THE BRAIN OF THE WAR ROOM (VAL ANALYTICS AI).
        Analyze the match data for map: {match.map_name or 'unknown'}.
        Final Result: {match.team_rounds_won} - {match.team_rounds_lost} ({match.result})
        Source Type: {match.data_source}

        Combat In-Depth Stats:
        {players_stats}
        
        TASK:
        You must provide a high-level tactical debriefing for a professional coach.
        Language: SPANISH.
        Output exactly these sections in markdown:
        ### ⚡ PROBLEMA TÁCTICO CENTRAL
        (Identify the pattern that led to round losses or poor performance)

        ### 🎯 RECONOCIMIENTO DE OPERADOR
        (Standout player performance analysis based on stats)

        ### 📋 ACCIÓN OPERATIVA (PRÓXIMO SCRIM)
        (One specific, concrete drill or tactical change to implement next)

        Format: High-end professional tone. Max 200 words.
        """

    def _get_mock_feedback(self, match: models.Match) -> str:
        if match.result == 'W':
            return "### ⚡ PROBLEMA TÁCTICO CENTRAL\nFallas menores en el uso de utilidad post-plant.\n\n### 🎯 RECONOCIMIENTO DE OPERADOR\nEntradas agresivas aseguraron el control temprano del mapa.\n\n### 📋 ACCIÓN OPERATIVA (PRÓXIMO SCRIM)\nRefinar las capas de utilidad al defender el sitio."
        else:
            return "### ⚡ PROBLEMA TÁCTICO CENTRAL\nAlta vulnerabilidad en el control defensivo de medio.\n\n### 🎯 RECONOCIMIENTO DE OPERADOR\nFalta de apoyo consistente para los fraggers de entrada.\n\n### 📋 ACCIÓN OPERATIVA (PRÓXIMO SCRIM)\nPriorizar los intercambios (trading) sobre las jugadas individuales."
