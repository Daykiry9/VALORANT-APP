"""Correctness tests for analytics aggregations — the math pro teams will double-check."""
from __future__ import annotations

import datetime as dt
import uuid

import models
from core.analytics.player_aggregates import player_by_agent, player_by_map, player_summary
from core.analytics.team_aggregates import team_map_pool, team_summary
from core.analytics.scouting import scouting_report
from core.cache import invalidate_all


def _seed_matches(db, team_id, rows):
    """rows: list of (result, rounds_won, rounds_lost, map_name, opponent, tier, def_pistol, att_pistol, days_ago)"""
    for i, (result, rw, rl, map_name, opp, tier, dp, ap, days_ago) in enumerate(rows):
        m = models.Match(
            id=uuid.uuid4(),
            team_id=team_id,
            type="scrim",
            date=dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days_ago),
            map_name=map_name,
            result=result,
            team_rounds_won=rw,
            team_rounds_lost=rl,
            defense_rounds_won=rw // 2,
            attack_rounds_won=rw - rw // 2,
            def_pistol=dp,
            att_pistol=ap,
            opponent_name=opp,
            opponent_tier=tier,
            composition="[]",
            data_source="manual",
        )
        db.add(m)
    db.commit()


def _seed_player_with_stats(db, team_id, name, role, rows):
    """rows: list of dicts with match stats."""
    p = models.Player(
        id=uuid.uuid4(),
        team_id=team_id,
        display_name=name,
        role=role,
        riot_id=f"{name}#NA1",
    )
    db.add(p)
    db.commit()
    for stat in rows:
        m = models.Match(
            id=uuid.uuid4(),
            team_id=team_id,
            type="scrim",
            date=dt.datetime.now(dt.timezone.utc),
            map_name=stat["map"],
            result=stat["result"],
            team_rounds_won=13 if stat["result"] == "W" else 7,
            team_rounds_lost=10,
            data_source="manual",
            composition="[]",
        )
        db.add(m)
        db.flush()
        db.add(models.MatchPlayerStat(
            match_id=m.id,
            player_id=p.id,
            agent=stat["agent"],
            acs=stat["acs"],
            kills=stat["kills"],
            deaths=stat["deaths"],
            assists=stat["assists"],
            kast_pct=stat.get("kast", 0),
            adr=stat.get("adr", 0),
            hs_pct=stat.get("hs", 0),
            first_bloods=stat.get("fb", 0),
            first_deaths=stat.get("fd", 0),
        ))
    db.commit()
    return p


def test_team_summary_math(db_session, team):
    invalidate_all()
    _seed_matches(db_session, team.id, [
        ("W", 13, 10, "Ascent", "Rival A", "T2", "W", "L", 1),
        ("W", 13, 7, "Haven", "Rival A", "T2", "W", "W", 2),
        ("L", 9, 13, "Bind", "Rival B", "T1", "L", "L", 3),
        ("W", 13, 11, "Ascent", "Rival C", "T3", None, "W", 4),
    ])

    s = team_summary(db_session, team.id)
    assert s["matches_played"] == 4
    assert s["wins"] == 3
    assert s["losses"] == 1
    assert s["winrate"] == 75.0
    # streak is by date desc — W(1d), W(2d), L(3d), W(4d) → current streak W2
    assert s["streak"] == "W2"
    # pistol_winrate: 2/5 pistols were W (WW in match1 is def=W att=L; only 4 pistols known in last match)
    # Known pistols: W,L,W,W,L,L,W = 4W/7 = 57.1%
    assert 50 <= s["pistol_winrate"] <= 60


def test_team_map_pool(db_session, team):
    invalidate_all()
    _seed_matches(db_session, team.id, [
        ("W", 13, 10, "Ascent", "A", "T2", "W", "L", 1),
        ("W", 13, 11, "Ascent", "B", "T2", "L", "W", 2),
        ("L", 8, 13, "Ascent", "C", "T2", "L", "L", 3),
        ("W", 13, 5, "Haven", "A", "T2", "W", "W", 4),
    ])

    pool = team_map_pool(db_session, team.id)
    ascent = next(r for r in pool if r["map_name"] == "Ascent")
    haven = next(r for r in pool if r["map_name"] == "Haven")

    assert ascent["games"] == 3
    assert ascent["wins"] == 2
    assert ascent["winrate"] == 66.7
    assert haven["games"] == 1
    assert haven["winrate"] == 100.0


def test_player_summary_aggregates(db_session, team):
    invalidate_all()
    p = _seed_player_with_stats(db_session, team.id, "Alpha", "duelist", [
        {"map": "Ascent", "agent": "Jett", "result": "W", "acs": 300, "kills": 20, "deaths": 15, "assists": 4, "kast": 75, "adr": 150, "hs": 25, "fb": 6, "fd": 3},
        {"map": "Haven",  "agent": "Jett", "result": "W", "acs": 240, "kills": 18, "deaths": 14, "assists": 5, "kast": 70, "adr": 130, "hs": 22, "fb": 4, "fd": 4},
        {"map": "Bind",   "agent": "Raze", "result": "L", "acs": 180, "kills": 12, "deaths": 18, "assists": 3, "kast": 60, "adr": 110, "hs": 18, "fb": 2, "fd": 5},
    ])

    s = player_summary(db_session, p.id, team.id)
    assert s["matches_played"] == 3
    assert s["wins"] == 2
    assert s["losses"] == 1
    assert s["winrate"] == 66.7
    # K/D = (20+18+12) / (15+14+18) = 50/47 ≈ 1.064
    assert abs(s["kd"] - round(50 / 47, 2)) < 0.01
    # avg ACS = (300+240+180)/3 = 240
    assert s["avg_acs"] == 240.0


def test_player_by_agent(db_session, team):
    invalidate_all()
    p = _seed_player_with_stats(db_session, team.id, "Alpha", "duelist", [
        {"map": "Ascent", "agent": "Jett", "result": "W", "acs": 300, "kills": 20, "deaths": 15, "assists": 4},
        {"map": "Haven",  "agent": "Jett", "result": "L", "acs": 200, "kills": 14, "deaths": 18, "assists": 2},
        {"map": "Bind",   "agent": "Raze", "result": "W", "acs": 260, "kills": 18, "deaths": 12, "assists": 5},
    ])

    rows = player_by_agent(db_session, p.id, team.id)
    jett = next(r for r in rows if r["agent"] == "Jett")
    raze = next(r for r in rows if r["agent"] == "Raze")

    assert jett["games"] == 2
    assert jett["winrate"] == 50.0
    assert raze["games"] == 1
    assert raze["winrate"] == 100.0


def test_player_by_map(db_session, team):
    invalidate_all()
    p = _seed_player_with_stats(db_session, team.id, "Alpha", "duelist", [
        {"map": "Ascent", "agent": "Jett", "result": "W", "acs": 300, "kills": 20, "deaths": 15, "assists": 4},
        {"map": "Ascent", "agent": "Jett", "result": "L", "acs": 150, "kills": 10, "deaths": 18, "assists": 3},
        {"map": "Bind",   "agent": "Raze", "result": "W", "acs": 260, "kills": 18, "deaths": 12, "assists": 5},
    ])

    rows = player_by_map(db_session, p.id, team.id)
    ascent = next(r for r in rows if r["map_name"] == "Ascent")
    assert ascent["games"] == 2
    assert ascent["winrate"] == 50.0


def test_scouting_report_per_opponent(db_session, team):
    invalidate_all()
    _seed_matches(db_session, team.id, [
        ("W", 13, 10, "Ascent", "Rival A", "T2", "W", "L", 1),
        ("L", 8,  13, "Haven",  "Rival A", "T2", "L", "L", 3),
        ("L", 9,  13, "Bind",   "Rival A", "T2", "W", "L", 5),
        ("W", 13, 7,  "Ascent", "Rival B", "T3", "W", "W", 2),  # different opponent
    ])

    r = scouting_report(db_session, team.id, "Rival A")
    assert r["total_games"] == 3
    assert r["wins"] == 1
    assert r["losses"] == 2
    assert r["winrate"] == 33.3
    maps = {row["map_name"]: row for row in r["by_map"]}
    assert maps["Ascent"]["winrate"] == 100.0
    assert maps["Haven"]["winrate"] == 0.0
    assert r["pistol_pattern"]["def_won"] == 2
    assert r["pistol_pattern"]["att_won"] == 0
