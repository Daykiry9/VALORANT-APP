"""API smoke tests — auth gate, structured errors, is_tryout flow."""
from __future__ import annotations


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_team_and_player_flow(client, db_session):
    # Initial dev user auto-created and linked to team
    r = client.post("/api/teams/", json={"name": "Test", "tag": "TST", "region": "la1"})
    assert r.status_code == 200, r.text

    r = client.post("/api/players/", json={
        "display_name": "Alpha", "riot_id": "Alpha#NA1", "role": "duelist"
    })
    assert r.status_code == 200, r.text
    alpha = r.json()
    assert alpha["is_tryout"] is False

    r = client.post("/api/players/", json={
        "display_name": "Bravo", "riot_id": "Bravo#NA1", "role": "initiator", "is_tryout": True
    })
    bravo = r.json()
    assert bravo["is_tryout"] is True

    # Main roster only returns Alpha
    r = client.get("/api/players/?is_tryout=false")
    assert len(r.json()) == 1
    assert r.json()[0]["display_name"] == "Alpha"

    # Promote Bravo → Main
    r = client.patch(f"/api/players/{bravo['id']}/promote")
    assert r.status_code == 200
    assert r.json()["is_tryout"] is False

    # is_tryout=all returns both
    assert len(client.get("/api/players/?is_tryout=all").json()) == 2


def test_structured_error_shape(client):
    # Request to a non-existent match insight
    r = client.get("/api/ai/match/00000000-0000-0000-0000-000000000000/insights")
    assert r.status_code in (403, 404)
    body = r.json()
    assert "error" in body
    assert {"code", "message", "request_id"} <= body["error"].keys()


def test_compare_requires_two_players(client):
    r = client.post("/api/analytics/compare", json={"player_ids": ["00000000-0000-0000-0000-000000000000"]})
    assert r.status_code == 422  # Pydantic min_length=2


def test_unknown_route_404(client):
    r = client.get("/api/nope")
    assert r.status_code == 404
