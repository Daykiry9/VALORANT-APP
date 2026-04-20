import datetime
import uuid

from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Text, Integer, Numeric, DATE, JSON, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.sql import func

from database import Base


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Team(Base):
    __tablename__ = "teams"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name = Column(String(100))
    tag = Column(String(10))
    region = Column(String(10))
    plan = Column(String(20), default='free')
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    """Local mirror of Supabase auth users. Links Supabase identity -> team context."""
    __tablename__ = "users"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_user_id = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255))
    display_name = Column(String(100))
    team_id = Column(Uuid(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    org_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    role = Column(String(20), default='coach')  # owner | coach | analyst
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Player(Base):
    __tablename__ = "players"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Uuid(as_uuid=True), ForeignKey("teams.id"))
    riot_id = Column(String(100))
    puuid = Column(String(100), unique=True, nullable=True)
    display_name = Column(String(100))
    role = Column(String(30))
    role_inferred = Column(Boolean, default=True)
    rso_linked = Column(Boolean, default=False)
    rso_access_token = Column(Text)
    rso_refresh_token = Column(Text)
    active = Column(Boolean, default=True)
    is_tryout = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DATE, default=datetime.date.today)
    left_at = Column(DATE, nullable=True)


class Match(Base):
    __tablename__ = "matches"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Uuid(as_uuid=True), ForeignKey("teams.id"))
    riot_match_id = Column(String(100), unique=True, nullable=True)
    type = Column(String(10))
    date = Column(DateTime(timezone=True))
    map_id = Column(String(50))
    map_name = Column(String(50))
    result = Column(String(1))
    team_rounds_won = Column(Integer)
    team_rounds_lost = Column(Integer)
    defense_rounds_won = Column(Integer)
    attack_rounds_won = Column(Integer)
    def_pistol = Column(String(1))
    att_pistol = Column(String(1))
    opponent_name = Column(String(100))
    opponent_tier = Column(String(5))
    composition = Column(String(200))
    vod_link = Column(String(500))
    notes = Column(Text)
    data_source = Column(String(10))
    api_fetched = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MatchPlayerStat(Base):
    __tablename__ = "match_player_stats"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(Uuid(as_uuid=True), ForeignKey("matches.id"))
    player_id = Column(Uuid(as_uuid=True), ForeignKey("players.id"), nullable=True)
    agent = Column(String(50))
    acs = Column(Integer)
    kills = Column(Integer)
    deaths = Column(Integer)
    assists = Column(Integer)
    first_bloods = Column(Integer)
    first_deaths = Column(Integer)
    hs_pct = Column(Numeric(5, 2))
    kast_pct = Column(Numeric(5, 2))
    adr = Column(Numeric(7, 2))
    score = Column(Integer)
    multikill_2k = Column(Integer)
    multikill_3k = Column(Integer)
    multikill_4k = Column(Integer)
    multikill_5k = Column(Integer)
    clutches_won = Column(Integer)
    clutch_opportunities = Column(Integer)
    plants = Column(Integer)
    defuses = Column(Integer)


class Round(Base):
    __tablename__ = "rounds"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(Uuid(as_uuid=True), ForeignKey("matches.id"))
    round_number = Column(Integer)
    winning_team = Column(String(10))
    end_type = Column(String(20))
    ceremony = Column(String(20))
    team_buy_type = Column(String(20))
    opponent_buy_type = Column(String(20))


class RoundEvent(Base):
    __tablename__ = "round_events"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id = Column(Uuid(as_uuid=True), ForeignKey("rounds.id"))
    match_id = Column(Uuid(as_uuid=True), ForeignKey("matches.id"))
    event_type = Column(String(20))
    timestamp_ms = Column(Integer)
    actor_player_id = Column(Uuid(as_uuid=True), ForeignKey("players.id"), nullable=True)
    victim_player_id = Column(Uuid(as_uuid=True), ForeignKey("players.id"), nullable=True)
    weapon = Column(String(50))
    finishing_damage_type = Column(String(20))
    is_first_blood = Column(Boolean, default=False)
    is_first_death = Column(Boolean, default=False)
    kill_order_in_round = Column(Integer)
    assistants = Column(JSON)


class MatchInsight(Base):
    """Versioned AI-generated insights. Each generation is a new row; history retained."""
    __tablename__ = "match_insights"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(Uuid(as_uuid=True), ForeignKey("matches.id"), nullable=False, index=True)
    prompt_type = Column(String(40), nullable=False)  # match_tactical | player_weakness | tryout_verdict | composition_read
    version = Column(Integer, nullable=False, default=1)
    model = Column(String(50), nullable=False)
    content_json = Column(JSON, nullable=False)
    prompt_hash = Column(String(64))
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generated_by_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint('match_id', 'prompt_type', 'version', name='uq_match_insight_version'),
    )


class ApiCache(Base):
    __tablename__ = "api_cache"
    puuid = Column(String(100), primary_key=True)
    match_id = Column(String(100), primary_key=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
