"""Pre-match scouting briefing. Outputs ScoutingReport."""
from __future__ import annotations

import json
from typing import List
from pydantic import BaseModel

from core.ai.config import GenParams
from core.ai.structured import generate_structured


class ScoutingReport(BaseModel):
    threat_level: str  # low | medium | high | elite
    map_priority: List[str]  # maps in order of "pick first" vs them
    map_to_ban: List[str]
    expected_playstyle: str
    detected_weaknesses: List[str]
    gameplan: List[str]
    pistol_read: str
    confidence: float


def generate_scouting_report(report: dict) -> ScoutingReport:
    """`report` is the dict returned by core.analytics.scouting.scouting_report."""
    prompt = f"""Eres un scout pro de Valorant preparando al equipo para un próximo encuentro.
Tu output debe ser ACCIONABLE: el coach lo lee y sabe qué mapa banear, qué esperar, y cómo jugar.

### RIVAL
Nombre: {report['opponent_name']}
Tier: {report.get('tier') or 'desconocido'}
Historial vs nosotros: {report['total_games']} partidas, WR {report['winrate']}% ({report['wins']}W-{report['losses']}L-{report['draws']}D)
Diferencia de rondas promedio: {report['avg_round_diff']}

### PER MAPA
{json.dumps(report['by_map'], indent=2)}

### PATRÓN DE PISTOL
DEF ganadas: {report['pistol_pattern']['def_won']} | DEF perdidas: {report['pistol_pattern']['def_lost']}
ATK ganadas: {report['pistol_pattern']['att_won']} | ATK perdidas: {report['pistol_pattern']['att_lost']}

### ÚLTIMAS 10 PARTIDAS
{json.dumps(report['recent_matches'], indent=2)}

### INSTRUCCIONES
Responde SOLO JSON válido. Razona internamente:
1. ¿En qué mapas somos claramente mejores? Esos los priorizamos.
2. ¿En qué mapas nos dominan? Ban candidates.
3. ¿Tendencia en pistol? Si ellos ganan defense pistols, respetar su setup; si attack, anticipar rush.
4. ¿Composiciones que han usado contra nosotros revelan estilo (slow default, fast exec, heavy util)?
5. ¿Qué hueco en su juego podemos explotar? Evidencia numérica.

Campos:
- `threat_level`: low | medium | high | elite (basado en WR + tier + sample size)
- `map_priority`: array ordenado de mapas donde conviene jugar (best first)
- `map_to_ban`: array de mapas a banear (peor winrate vs ellos, min 2 games)
- `expected_playstyle`: 1-2 frases describiendo su estilo observado
- `detected_weaknesses`: 2-4 debilidades con evidencia
- `gameplan`: 3-5 pasos concretos (ej: "Default lentos en defense para forzar su rotación")
- `pistol_read`: 1-2 frases sobre su economía/pistol
- `confidence`: 0.0-1.0 según sample size (< 3 games = baja confianza)

Español. Directo. Sin emojis."""

    return generate_structured(
        prompt=prompt,
        schema=ScoutingReport,
        params=GenParams(temperature=0.3, max_output_tokens=1400),
    )
