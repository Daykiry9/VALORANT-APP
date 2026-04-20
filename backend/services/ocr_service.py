"""OCR / vision extraction of Valorant scoreboards via Gemini Vision.

Uses structured JSON output with a strict schema and two few-shot examples.
Returns validated data; never guesses — emits null when unsure.
"""
from __future__ import annotations

import io
import logging
from typing import List, Optional

from PIL import Image
from pydantic import BaseModel, Field

from core.ai.config import GenParams, is_enabled
from core.ai.structured import generate_structured


log = logging.getLogger(__name__)


class OcrPlayerRow(BaseModel):
    name: Optional[str] = None
    agent: Optional[str] = None
    acs: Optional[int] = None
    kills: Optional[int] = None
    deaths: Optional[int] = None
    assists: Optional[int] = None
    econ: Optional[int] = None
    first_bloods: Optional[int] = None
    plants: Optional[int] = None
    defuses: Optional[int] = None


class OcrRoundRow(BaseModel):
    round_number: Optional[int] = None
    winner: Optional[str] = None  # "Our Team" | "Rival"
    end_type: Optional[str] = None  # Elimination | Bomb Detonated | Defuse | Time


class OcrScoreboard(BaseModel):
    map_name: Optional[str] = None
    our_score: Optional[int] = None
    rival_score: Optional[int] = None
    scoreboard: List[OcrPlayerRow] = Field(default_factory=list)
    timeline: List[OcrRoundRow] = Field(default_factory=list)


_SYSTEM_PROMPT = """Eres un parser visual experto de screenshots de Valorant. Tu tarea es extraer datos estructurados
DESDE LA IMAGEN y emitir JSON válido. Regla absoluta: cuando no puedas leer un campo con certeza, emite null.
NUNCA INVENTES datos ni aproximes.

Si la captura NO es un scoreboard/timeline de Valorant, emite un objeto con todos los campos null o vacíos.

Formatos reconocibles:
- Scoreboard end-game: tabla con 10 jugadores (5 por equipo), columnas típicas ACS / K / D / A / Econ / FB / Plants / Defuses
- Timeline: 24 rondas max, badge por ronda indicando quién ganó y cómo

Campos:
- `map_name`: string, nombre oficial del mapa (Ascent, Haven, Split, Bind, Lotus, Sunset, Breeze, Icebox, Pearl, Fracture, Abyss)
- `our_score` / `rival_score`: rondas ganadas finales
- `scoreboard[]`: fila por jugador — name, agent (nombre en inglés del agente), acs, kills, deaths, assists, econ, first_bloods, plants, defuses
- `timeline[]`: fila por ronda — round_number (1-24), winner ("Our Team" | "Rival"), end_type ("Elimination" | "Bomb Detonated" | "Defuse" | "Time")

### EJEMPLO 1 (input limpio)
Entrada: scoreboard end-game limpio, 5v5, todos los números legibles.
Salida esperada (resumida):
{
  "map_name": "Ascent",
  "our_score": 13,
  "rival_score": 10,
  "scoreboard": [
    {"name": "PlayerA", "agent": "Jett", "acs": 312, "kills": 22, "deaths": 15, "assists": 4, "econ": 87, "first_bloods": 6, "plants": 2, "defuses": 0},
    ... 9 más
  ],
  "timeline": [
    {"round_number": 1, "winner": "Our Team", "end_type": "Elimination"},
    ... hasta la última ronda
  ]
}

### EJEMPLO 2 (parcialmente oculto)
Entrada: solo se ve parte del scoreboard; la columna "econ" está cortada y 2 nombres ilegibles.
Salida esperada: agent/acs/kills/deaths/assists poblados con los valores visibles; econ=null para todos; name=null en los 2 ilegibles. Si no hay timeline visible: "timeline": [].

Responde SOLO con JSON válido. Sin markdown. Sin texto explicativo."""


def process_scoreboard_image(image_bytes: bytes) -> dict:
    """Entry point used by `/api/scrims/upload-scoreboard`."""
    if not is_enabled():
        return {"success": False, "error": "Gemini API key not configured."}

    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        return {"success": False, "error": f"Invalid image: {e}"}

    try:
        result = generate_structured(
            prompt=_SYSTEM_PROMPT,
            schema=OcrScoreboard,
            params=GenParams(temperature=0.0, max_output_tokens=2500),
            images=[img],
        )
        return {"success": True, "data": result.model_dump()}
    except Exception as e:
        log.exception("OCR failed")
        return {"success": False, "error": f"AI Vision Error: {e}"}
