import os
import logging
from sqlalchemy.orm import Session
import google.generativeai as genai
import anthropic
import models
from typing import Optional

logger = logging.getLogger(__name__)

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Configuration
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class MatchAIInsightService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_match_feedback(self, match_id: str) -> str:
        """
        Generates tactical feedback using either Anthropic (preferred if available) or Gemini.
        """
        match = self.db.query(models.Match).filter(models.Match.id == match_id).first()
        if not match:
            return "Error: Match not found in database."

        prompt = self._build_tactical_prompt(match)

        # 1. Try Anthropic (Claude) if configured
        if ANTHROPIC_API_KEY:
            try:
                client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                message = client.messages.create(
                    model=ANTHROPIC_MODEL,
                    max_tokens=600,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text
            except Exception as e:
                logger.error(f"Error calling Claude API: {e}")
                # Fallthrough to Gemini if Claude fails

        # 2. Try Gemini
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel(GEMINI_MODEL)
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
                return self._get_mock_feedback(match)

        # 3. Final Fallback
        return self._get_mock_feedback(match)

    def _build_tactical_prompt(self, match: models.Match) -> str:
        players_stats = ""
        for p in match.player_stats:
            agent_name = p.agent or "Unknown"
            players_stats += f"- Agent: {agent_name}, ACS: {p.acs}, KDA: {p.kills}/{p.deaths}/{p.assists}, FB: {p.first_bloods}, FD: {p.first_deaths}, KAST: {p.kast_pct}%, ADR: {p.adr}\n"

        return f"""
        YOU ARE A PROFESSIONAL VALORANT ANALYST (TACTICAL WAR ROOM).
        Analyze this match on map {match.map_name or 'unknown'}.
        Result: {match.team_rounds_won} - {match.team_rounds_lost} ({match.result})
        Data Source: {match.data_source}

        Team Performance:
        {players_stats}
        
        TASK:
        Respond with exactly these 3 sections in markdown:
        ### ⚡ MAIN PROBLEM
        (Identify a specific tactical weakness that cost rounds)

        ### 🎯 STANDOUT PLAYER
        (Identify the high impact player and why)

        ### 📋 ACTION FOR NEXT SCRIM
        (Concrete and executable tactical recommendation)

        Format: Concise markdown, military/competitive tone, max 150 words. Language: Spanish.
        """

    def _get_mock_feedback(self, match: models.Match) -> str:
        if match.result == 'W':
            return "### ⚡ MAIN PROBLEM\nMinor flaws in post-plant utility usage.\n\n### 🎯 STANDOUT PLAYER\nAggressive entries secured early map control.\n\n### 📋 ACTION FOR NEXT SCRIM\nRefine site-holding utility layers."
        else:
            return "### ⚡ MAIN PROBLEM\nHigh vulnerability in defensive mid-control.\n\n### 🎯 STANDOUT PLAYER\nLack of consistent support for entry fraggers.\n\n### 📋 ACTION FOR NEXT SCRIM\nPrioritize trade-fragging over individual plays."
