"""Pytest fixtures. Each test gets a fresh SQLite DB + TestClient."""
from __future__ import annotations

import os
import uuid

# Ensure we run in dev bypass + rate limits off before FastAPI imports.
os.environ.setdefault("DEV_AUTH_BYPASS", "1")
os.environ.setdefault("RATE_LIMIT_ENABLED", "0")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import sys
from pathlib import Path

# Make `backend/` importable when running `pytest` from repo root or backend/.
BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
import models  # noqa: F401 — register models on Base
import main as app_main


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    database.Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()

    # Override the app's get_db dependency to use this isolated session.
    def _override():
        try:
            yield session
        finally:
            pass

    app_main.app.dependency_overrides[database.get_db] = _override
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
        app_main.app.dependency_overrides.pop(database.get_db, None)


@pytest.fixture()
def client(db_session):
    with TestClient(app_main.app) as c:
        yield c


@pytest.fixture()
def team(db_session):
    """A fresh team plus a dev user linked to it (dev-bypass path uses this)."""
    t = models.Team(id=uuid.uuid4(), name="Test Team", tag="TST", region="la1", plan="franchise")
    db_session.add(t)
    u = models.User(
        id=uuid.uuid4(),
        supabase_user_id="dev-local",
        email="dev@local",
        display_name="Dev",
        team_id=t.id,
        org_id=t.org_id,
        role="owner",
    )
    db_session.add(u)
    db_session.commit()
    return t
