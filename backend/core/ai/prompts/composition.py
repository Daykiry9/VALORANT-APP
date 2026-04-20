"""Team composition / meta read. Outputs CompositionRead."""
from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy.orm import Session

from core.ai.config import GenParams
from core.ai.structured import generate_structured
from core.analytics.team_aggregates import team_composition_performance, team_map_pool, team_summary
from schemas import CompositionRead


def generate_composition_read(db: Session, team_id: UUID) -> CompositionRead:
    summary = team_summary(db, team_id)
    map_pool = team_map_pool(db, team_id)[:8]
    comps = team_composition_performance(db, team_id)[:10]

    prompt = f"""Eres un analista táctico de Valorant (nivel VCT). Analiza la tendencia de composiciones y pool
de mapas del equipo. Tu lectura debe identificar synergies, huecos en roles, y sugerencias concretas
basadas en meta actual (post-parches recientes del juego, agente más picado por tier, map pool competitivo).

### TEAM SUMMARY
WR global: {summary.get('winrate')}% ({summary.get('wins')}W-{summary.get('losses')}L-{summary.get('draws')}D)
Racha: {summary.get('streak')}
Pistol WR: {summary.get('pistol_winrate')}%
Promedios: ganadas {summary.get('avg_rounds_won')} / perdidas {summary.get('avg_rounds_lost')} por match

### MAP POOL (desc por games)
{json.dumps(map_pool, indent=2)}

### COMPOSICIONES MÁS JUGADAS (top 10)
{json.dumps(comps, indent=2)}

### INSTRUCCIONES
Responde SOLO con JSON válido:
- `synergy`: 2-3 frases sobre cómo trabajan las composiciones dominantes (o por qué no fluyen)
- `missing_roles`: array de roles infrarrepresentados en el pool (duelist/initiator/controller/sentinel/flex)
- `meta_suggestions`: 3-5 sugerencias concretas (agente a considerar por mapa, por qué, qué rol cubre)

Español. Técnico. Sin emojis."""

    return generate_structured(
        prompt=prompt,
        schema=CompositionRead,
        params=GenParams(temperature=0.35, max_output_tokens=1200),
    )
