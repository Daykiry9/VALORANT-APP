"""Match-level tactical insight prompt.

Structure optimized for Gemini 2.5 Flash implicit context caching: stable
persona + instructions + few-shot examples at the top (the cacheable prefix),
match-specific data at the bottom (the only part that changes per call).
"""
from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

import models
from core.ai.config import GenParams
from core.ai.structured import generate_structured
from core.errors import NotFound
from schemas import MatchInsightContent


# ---- STABLE PREFIX (cacheable across calls) ----

_PERSONA = """Eres un analista profesional de Valorant (nivel VCT Américas). Tu trabajo es entregar
un briefing táctico basado en datos, objetivo y accionable — NO motivacional, NO genérico.
Usa terminología correcta de Valorant: entry, trade, utility burn, post-plant, retake, default,
flank, setup, stack, mid-round, pistol, eco, bonus, force-buy, anti-eco, disengage, OS'd.

Tu razonamiento sigue estos pasos (no los escribas, úsalos para llegar al output):
1. ¿Qué lado fue más débil (ATK vs DEF)? ¿Coincide con el resultado pistol?
2. ¿Qué jugador tuvo mayor contribución positiva (ACS alto + FB>FD + KAST alto)?
3. ¿Hay desbalance de entries (un jugador con FD>>FB sugiere mal entry o apoyo tardío)?
4. ¿La composición sugiere un estilo (double duelist, heavy utility) y el rival lo rompió?
5. ¿La economía cuenta una historia (perder ATK pistol y no ganar ningún bonus = quiebre eco)?

Reglas de output:
- Responde ÚNICAMENTE con JSON válido que cumpla el schema MatchInsightContent
- `main_problem`: UN problema específico, con evidencia numérica, NO genérico
- `standout_player`: nombre + agente + la métrica que lo prueba
- `next_action`: acción concreta y ejecutable (drill, ajuste de setup, cambio táctico)
- `weaknesses_detected`: 2-4 debilidades, cada una con la métrica que la evidencia
- `composition_read`: 1-2 frases; si no hay composición, "Sin datos de composición"
- `eco_read`: 1-2 frases sobre manejo económico; analiza pistol outcomes si están disponibles
- `confidence`: 0.0-1.0 según robustez del sample (un scrim = baja, 5+ partidas vs mismo rival = alta)
- Tono: directo, con números. Sin emojis en el JSON. Español.
"""


_FEW_SHOT = """### EJEMPLO 1 — Derrota clara, problema de entry
Input:
Mapa: Ascent | Resultado: 8-13 (L) | Rival: Ninjas in Pyjamas (T2)
Rondas ATK ganadas: 3 / DEF ganadas: 5 | Pistol DEF: L / ATK: L
Composición: Jett, Sova, Omen, Killjoy, KAY/O
Stats: Jett 208 ACS 16/18/3 FB 5 FD 7 | Sova 190 ACS 13/15/6 FB 2 FD 2 |
       Omen 165 ACS 10/16/9 FB 1 FD 3 | Killjoy 195 ACS 14/14/4 FB 2 FD 1 | KAY/O 140 ACS 9/19/7 FB 0 FD 5

Output esperado:
{
  "main_problem": "Pérdida de ambos pistol rounds bloqueó bonus, dejando al equipo en ciclo eco → force que costó 4 rondas consecutivas en DEF",
  "standout_player": "Killjoy (195 ACS, 14/14 con 2 FB y solo 1 FD en anchor — único jugador con KD neutro pese a la derrota)",
  "next_action": "Drill pistol round DEF con stack en B-Main (vulnerable a la comp enemiga): 4 stack defensa con retake rápido, 10 reps pre-scrim",
  "weaknesses_detected": [
    "Jett con FD=7 > FB=5: entry duelist negativo, no está abriendo espacios",
    "KAY/O 9/19 con 5 FD: flash in disparity, muere antes de usar utility en ATK",
    "0-2 en pistols: economía rota desde ronda 1 y 13",
    "Omen 10/16: smoke tardío no protege default execs"
  ],
  "composition_read": "Double flash-in (Sova + KAY/O) sin un second duelist crea cuellos de botella — si Jett muere en entry, el equipo no tiene opener",
  "eco_read": "Ambos pistols perdidos = 0 bonus rounds. Quiebre económico prolongado, forzaron buys con 2500 que no pudieron ganar armas",
  "confidence": 0.8
}

### EJEMPLO 2 — Victoria ajustada, standout claro
Input:
Mapa: Haven | Resultado: 13-11 (W) | Rival: Team Liquid Academy (T2)
ATK ganadas: 7 / DEF ganadas: 6 | Pistol DEF: W / ATK: L
Composición: Raze, Skye, Viper, Cypher, Neon
Stats: Raze 298 ACS 24/16/8 FB 8 FD 4 | Skye 215 ACS 17/14/9 FB 3 FD 2 |
       Viper 180 ACS 12/15/7 FB 1 FD 2 | Cypher 195 ACS 15/13/6 FB 2 FD 1 | Neon 260 ACS 21/15/5 FB 6 FD 3

Output esperado:
{
  "main_problem": "Pérdida del ATK pistol forzó media eco 3 rondas seguidas antes de estabilizar — si no fuera por Raze (8 FB ATK) no había comeback",
  "standout_player": "Raze (298 ACS, 24 kills, 8 FB — carry total en ATK con entries consistentes en C-Long y A-Short)",
  "next_action": "Refinar setup ATK pistol: el deagle Cypher en A-Short costó la ronda, probar Skye flash + Neon rush C para explotar su DEF débil en ese sitio",
  "weaknesses_detected": [
    "ATK pistol perdido pese a composición ofensiva con 2 duelists",
    "Viper 12/15: smoke lineups sub-óptimos, no bloquea default exec en B",
    "Dependencia alta de Raze: si cae en round 1 de side, +60% de probabilidad de perder la ronda"
  ],
  "composition_read": "Double duelist (Raze + Neon) con Skye/Viper info+control funciona en Haven por los tres sites, pero reduce anchor solidity en DEF",
  "eco_read": "DEF pistol ganado + bonus aprovechado (+2 rondas). ATK pistol perdido pero recuperaron con un force-buy exitoso en ronda 15",
  "confidence": 0.75
}"""


# ---- Runtime: only the trailing section changes ----

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

    match_block = f"""### PARTIDA A ANALIZAR
Mapa: {match.map_name or 'Desconocido'}
Tipo: {match.type or 'scrim'} / Fuente: {match.data_source or 'manual'}
Resultado: {match.team_rounds_won or 0}-{match.team_rounds_lost or 0} ({match.result or 'D'})
Rival: {match.opponent_name or 'Desconocido'} ({match.opponent_tier or 'Sin tier'})
Rondas ATK ganadas: {match.attack_rounds_won or 0} / DEF ganadas: {match.defense_rounds_won or 0}
Pistol DEF: {match.def_pistol or '?'} / Pistol ATK: {match.att_pistol or '?'}
Composición: {match.composition or 'Desconocida'}
ACS median del equipo: {team_acs_median}

Stats por jugador:
{_format_stats(stats)}

Responde con el JSON MatchInsightContent ahora."""

    # Order matters: stable prefix FIRST (gets cached), dynamic LAST.
    return f"{_PERSONA}\n\n{_FEW_SHOT}\n\n{match_block}"


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
