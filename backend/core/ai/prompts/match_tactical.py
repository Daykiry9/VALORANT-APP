"""Match-level tactical insight prompt. Produces a structured MatchInsightContent JSON."""
from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

import models
from core.ai.config import GenParams
from core.ai.structured import generate_structured
from core.errors import NotFound
from schemas import MatchInsightContent


def _format_stats(stats: list[models.MatchPlayerStat]) -> str:
    lines = []
    for s in stats:
        kd = (s.kills or 0) / max(1, s.deaths or 1)
        lines.append(
            f"- {s.agent or 'N/A'} | ACS {s.acs or 0} | "
            f"K/D/A {s.kills or 0}/{s.deaths or 0}/{s.assists or 0} "
            f"(K/D {kd:.2f}) | KAST {float(s.kast_pct or 0):.0f}% | "
            f"ADR {float(s.adr or 0):.0f} | FB {s.first_bloods or 0} | FD {s.first_deaths or 0}"
        )
    return "\n".join(lines) or "Sin datos de jugadores."


def build_match_tactical_prompt(match: models.Match, stats: List[models.MatchPlayerStat]) -> str:
    acs_vals = [s.acs or 0 for s in stats if s.acs is not None]
    team_acs_median = sorted(acs_vals)[len(acs_vals) // 2] if acs_vals else 0

    return f"""Eres un analista profesional de Valorant (nivel VCT Américas). Tu trabajo es entregar un briefing táctico
basado en datos, objetivo y accionable — NO motivacional, NO genérico. Usa terminología correcta de Valorant
(entry, trade, utility burn, post-plant, retake, default, flank, setup, stack, mid-round, pistol, eco, bonus, force-buy).

### CONTEXTO DE LA PARTIDA
- Mapa: {match.map_name or 'Desconocido'}
- Tipo: {match.type or 'scrim'} / Fuente de datos: {match.data_source or 'manual'}
- Resultado: {match.team_rounds_won or 0}-{match.team_rounds_lost or 0} ({match.result or 'D'})
- Rival: {match.opponent_name or 'Desconocido'} ({match.opponent_tier or 'Sin tier'})
- Rondas ATK ganadas: {match.attack_rounds_won or 0} / Rondas DEF ganadas: {match.defense_rounds_won or 0}
- Pistol DEF: {match.def_pistol or '?'} / Pistol ATK: {match.att_pistol or '?'}
- Composición propia: {match.composition or 'Desconocida'}
- ACS median del equipo en este match: {team_acs_median}

### STATS POR JUGADOR
{_format_stats(stats)}

### INSTRUCCIONES
Razona internamente (no lo escribas):
1. ¿Qué lado fue más débil (ATK vs DEF)? ¿Coincide con el resultado pistol?
2. ¿Qué jugador tuvo mayor contribución positiva (ACS alto + FB>FD + KAST alto)?
3. ¿Hay desbalance de entries (un jugador con FD>>FB)?
4. ¿La composición sugiere un estilo (double duelist, heavy utility, etc) y el rival lo rompió?

Luego responde ÚNICAMENTE con un objeto JSON válido que cumpla el schema:
- `main_problem`: el problema táctico #1 que costó rondas (1 frase específica, no genérica)
- `standout_player`: jugador con mayor impacto + razón con números (ej: "Jett con 312 ACS y 7 FB vs 2 FD")
- `next_action`: UNA acción concreta y ejecutable para el próximo scrim (drill, ajuste de setup, cambio táctico)
- `weaknesses_detected`: array de 2-4 debilidades detectadas, cada una con la métrica que la evidencia
- `composition_read`: 1-2 frases leyendo la composición y si funcionó
- `eco_read`: 1-2 frases sobre manejo económico / pistol outcomes
- `confidence`: 0.0 a 1.0 según qué tan robusta sea tu lectura dado el sample

Tono: analista profesional, directo, con números. Sin emojis en el JSON. Español."""


def generate_match_insight(db: Session, match_id: str) -> MatchInsightContent:
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise NotFound("Match not found.")
    stats = db.query(models.MatchPlayerStat).filter(models.MatchPlayerStat.match_id == match.id).all()

    prompt = build_match_tactical_prompt(match, stats)
    return generate_structured(
        prompt=prompt,
        schema=MatchInsightContent,
        params=GenParams(temperature=0.3, max_output_tokens=1500),
    )
