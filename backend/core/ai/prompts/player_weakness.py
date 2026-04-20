"""Weakness / strength detection per player. Outputs PlayerWeaknessReport."""
from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy.orm import Session

from core.ai.config import GenParams
from core.ai.structured import generate_structured
from core.analytics.benchmarks import compute_role_benchmarks
from core.analytics.player_aggregates import player_by_agent, player_by_map, player_summary
from schemas import PlayerWeaknessReport


def _bench_deltas(summary: dict, bench: dict) -> dict:
    """Compute % delta vs role p50 for each major metric."""
    def d(actual: float, expected: float) -> float:
        if not expected:
            return 0.0
        return round(((actual - expected) / expected) * 100, 1)
    return {
        "acs_vs_p50": d(summary["avg_acs"], bench["acs"]["p50"]),
        "kd_vs_p50": d(summary["kd"], bench["kd"]["p50"]),
        "kast_vs_p50": d(summary["avg_kast"], bench["kast"]["p50"]),
        "adr_vs_p50": d(summary["avg_adr"], bench["adr"]["p50"]),
        "hs_vs_p50": d(summary["avg_hs_pct"], bench["hs_pct"]["p50"]),
    }


def generate_player_weakness_report(
    db: Session,
    player_id: UUID,
    team_id: UUID,
) -> PlayerWeaknessReport:
    summary = player_summary(db, player_id, team_id)
    by_agent = player_by_agent(db, player_id, team_id)
    by_map = player_by_map(db, player_id, team_id)
    bench = compute_role_benchmarks(db, summary.get("role") or "flex")
    deltas = _bench_deltas(summary, bench)

    prompt = f"""Eres un coach de Valorant analizando a un jugador para identificar oportunidades de mejora.
Tu análisis debe ser quirúrgico, basado en datos, específico por agente/mapa, y con drills ejecutables.

### JUGADOR
- Nombre: {summary.get('display_name')}
- Rol: {summary.get('role') or 'desconocido'}
- Tryout: {summary.get('is_tryout')}
- Partidas: {summary.get('matches_played')} | W/L: {summary.get('wins')}/{summary.get('losses')} ({summary.get('winrate')}%)

### SUMMARY GLOBAL
ACS {summary.get('avg_acs')} | K/D {summary.get('kd')} | KAST {summary.get('avg_kast')}% |
ADR {summary.get('avg_adr')} | HS% {summary.get('avg_hs_pct')} |
FB avg/match {summary.get('fb_rate')} | FD avg/match {summary.get('fd_rate')}

### BENCHMARK (rol: {bench.get('role')}, fuente: {bench.get('source')}, n={bench.get('sample_size')})
ACS p50 {bench['acs']['p50']:.0f} | K/D p50 {bench['kd']['p50']:.2f} |
KAST p50 {bench['kast']['p50']:.0f}% | ADR p50 {bench['adr']['p50']:.0f} | HS p50 {bench['hs_pct']['p50']:.0f}%

### DELTAS VS P50 (%)
{json.dumps(deltas, indent=2)}

### POR AGENTE (top 5)
{json.dumps(by_agent[:5], indent=2)}

### POR MAPA (top 5)
{json.dumps(by_map[:5], indent=2)}

### INSTRUCCIONES
Responde ÚNICAMENTE con JSON válido. Identifica:
- `top_weaknesses`: 3 debilidades concretas con evidencia numérica (ej: "FD rate 0.9/match, 35% sobre mediana del rol")
- `top_strengths`: 3 fortalezas con evidencia numérica
- `role_fit_score`: 0-100, qué tan bien fittea el rol asignado según sus métricas vs benchmark
- `recommended_drills`: 3-5 drills ejecutables y específicos (ej: "Aim train 30 min/día en headshots a 180° — HS% actual 18%", NO "practicar más")

Español. Tono coach pro: directo, técnico, sin rodeos. No emojis."""

    return generate_structured(
        prompt=prompt,
        schema=PlayerWeaknessReport,
        params=GenParams(temperature=0.25, max_output_tokens=1200),
    )
