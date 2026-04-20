"""Compare 2–3 players head-to-head: aggregate stats + pairwise diffs.

The AI verdict is attached by the caller via `core.ai.prompts.tryout_verdict`
when a Gemini key is configured; otherwise we return the structured diffs alone.
"""
from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from core.analytics.player_aggregates import player_by_agent, player_summary


METRICS = ("avg_acs", "kd", "avg_kast", "avg_adr", "avg_hs_pct", "fb_rate", "winrate")


def compare_players(db: Session, team_id: UUID, player_ids: List[UUID]) -> dict:
    summaries = [player_summary(db, pid, team_id) for pid in player_ids]
    diffs = []
    for metric in METRICS:
        values = [float(s.get(metric) or 0) for s in summaries]
        best = max(values) if values else 0.0
        diffs.append({
            "metric": metric,
            "values": values,
            "delta_vs_best": round(max(values) - min(values), 2) if values else 0.0,
            "best_index": values.index(best) if values else 0,
        })

    agent_pools = {str(pid): player_by_agent(db, pid, team_id)[:5] for pid in player_ids}

    return {
        "players": summaries,
        "diffs": diffs,
        "agent_pools": agent_pools,
    }
