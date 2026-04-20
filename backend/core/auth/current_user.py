"""Supabase JWT validation and per-request auth context.

Validates Bearer tokens issued by Supabase (HS256 signed with SUPABASE_JWT_SECRET),
mirrors the user locally in the `users` table on first contact, and exposes a
`AuthContext` dependency that every protected route consumes to derive
`user_id / team_id / org_id / plan / role`.

Dev bypass: set `DEV_AUTH_BYPASS=1` to skip JWT and fall back to the first team
found in the DB. Intended only for local testing.
"""
from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

import models
from database import get_db


SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_JWT_ALGORITHM = os.getenv("SUPABASE_JWT_ALGORITHM", "HS256")
SUPABASE_JWT_AUDIENCE = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
DEV_AUTH_BYPASS = os.getenv("DEV_AUTH_BYPASS", "0") == "1"


@dataclass(frozen=True)
class AuthContext:
    user_id: UUID
    supabase_user_id: str
    email: Optional[str]
    team_id: Optional[UUID]
    org_id: Optional[UUID]
    plan: str
    role: str  # owner | coach | analyst

    def require_team(self) -> UUID:
        if not self.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not linked to any team. Create or join a team first.",
            )
        return self.team_id


def _decode_jwt(token: str) -> dict:
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET not configured on server.",
        )
    try:
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[SUPABASE_JWT_ALGORITHM],
            audience=SUPABASE_JWT_AUDIENCE,
            options={"verify_exp": True},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def _resolve_or_create_user(
    db: Session,
    supabase_user_id: str,
    email: Optional[str],
    display_name: Optional[str],
) -> models.User:
    user = (
        db.query(models.User)
        .filter(models.User.supabase_user_id == supabase_user_id)
        .first()
    )
    if user:
        return user
    user = models.User(
        id=uuid.uuid4(),
        supabase_user_id=supabase_user_id,
        email=email,
        display_name=display_name,
        role="owner",  # first user is owner by default
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _dev_context(db: Session) -> AuthContext:
    """Dev fallback: pretend to be the first user/team in the DB (or synthesize one)."""
    user = db.query(models.User).first()
    if not user:
        # Create a dev user attached to the first team (or none)
        team = db.query(models.Team).first()
        user = models.User(
            id=uuid.uuid4(),
            supabase_user_id="dev-local",
            email="dev@local",
            display_name="Dev User",
            team_id=team.id if team else None,
            org_id=team.org_id if team else None,
            role="owner",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    plan = "franchise"
    if user.team_id:
        team = db.query(models.Team).filter(models.Team.id == user.team_id).first()
        if team and team.plan:
            plan = team.plan
    return AuthContext(
        user_id=user.id,
        supabase_user_id=user.supabase_user_id,
        email=user.email,
        team_id=user.team_id,
        org_id=user.org_id,
        plan=plan,
        role=user.role or "coach",
    )


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> AuthContext:
    if DEV_AUTH_BYPASS:
        return _dev_context(db)

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    payload = _decode_jwt(token)

    supabase_user_id = payload.get("sub")
    email = payload.get("email")
    display_name = (payload.get("user_metadata") or {}).get("full_name") or email

    if not supabase_user_id:
        raise HTTPException(status_code=401, detail="Token missing subject.")

    user = _resolve_or_create_user(db, supabase_user_id, email, display_name)

    plan = "free"
    if user.team_id:
        team = db.query(models.Team).filter(models.Team.id == user.team_id).first()
        if team and team.plan:
            plan = team.plan

    return AuthContext(
        user_id=user.id,
        supabase_user_id=user.supabase_user_id,
        email=user.email,
        team_id=user.team_id,
        org_id=user.org_id,
        plan=plan,
        role=user.role or "coach",
    )
