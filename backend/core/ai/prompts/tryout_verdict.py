"""Head-to-head tryout verdict. Consumed by /api/analytics/compare."""
from __future__ import annotations

import json
from typing import Optional

from core.ai.config import GenParams
from core.ai.structured import generate_structured
from schemas import TryoutVerdict


def generate_tryout_verdict(compare_payload: dict) -> Optional[TryoutVerdict]:
    players = compare_payload.get("players", [])
    diffs = compare_payload.get("diffs", [])
    agent_pools = compare_payload.get("agent_pools", {})

    if len(players) < 2:
        return None

    roster = "\n".join([
        f"[{p['player_id']}] {p['display_name']} — rol {p.get('role')}, {p['matches_played']} partidas, "
        f"WR {p['winrate']}%, ACS {p['avg_acs']}, K/D {p['kd']}, KAST {p['avg_kast']}%, ADR {p['avg_adr']}, "
        f"HS {p['avg_hs_pct']}%, FB/m {p['fb_rate']}, FD/m {p['fd_rate']}"
        for p in players
    ])

    prompt = f"""Eres un scout de Valorant evaluando candidatos para un roster. Tu trabajo es dar un veredicto
objetivo, no empate, basado en qué tan bien cada jugador encaja con el rol que juegan y el nivel requerido
por el equipo (tier-1/tier-2). Usa evidencia numérica específica.

### CANDIDATOS
{roster}

### AGENT POOLS (top 5 por jugador)
{json.dumps(agent_pools, indent=2)}

### DIFFS POR MÉTRICA
{json.dumps(diffs, indent=2)}

### INSTRUCCIONES
Responde SOLO con JSON válido:
- `recommendation`: UUID del jugador recomendado (uno de los candidatos). Si no hay claro ganador, elige el mejor
  por role-fit y explícalo en reasoning.
- `reasoning`: 2-4 frases con evidencia numérica. Directo, sin ambigüedad. Español.
- `pairwise_matrix`: array 2D de strings. Para cada par (i,j) con i!=j, una frase corta tipo
  "A > B en ACS (+15%), < B en KAST (-8%)". Si i==j, "".
- `role_fit_per_player`: objeto { player_id_str: score 0-100 }.

Sin emojis. Sin markdown."""

    return generate_structured(
        prompt=prompt,
        schema=TryoutVerdict,
        params=GenParams(temperature=0.3, max_output_tokens=1500),
    )
