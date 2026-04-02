from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Text, Integer, Numeric, DATE, JSON
# For SQLAlchemy 2.0+ UUID usage
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import Uuid
import uuid
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
    region = Column(String(10)) # la1, la2, na, eu, ap, br
    plan = Column(String(20), default='free') # free, rising, premier, franchise
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Player(Base):
    __tablename__ = "players"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Uuid(as_uuid=True), ForeignKey("teams.id"))
    riot_id = Column(String(100)) # gameName#tagLine
    puuid = Column(String(100), unique=True, nullable=True) # null si no vinculó
    display_name = Column(String(100))
    role = Column(String(30)) # duelist, initiator, controller, sentinel, flex
    role_inferred = Column(Boolean, default=True) # true = inferido por IA, false = asignado manual
    rso_linked = Column(Boolean, default=False)
    rso_access_token = Column(Text) # encriptado
    rso_refresh_token = Column(Text) # encriptado
    active = Column(Boolean, default=True)
    joined_at = Column(DATE, server_default=func.now())
    left_at = Column(DATE, nullable=True)

class Match(Base):
    __tablename__ = "matches"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Uuid(as_uuid=True), ForeignKey("teams.id"))
    riot_match_id = Column(String(100), unique=True, nullable=True) # null si es scrim sin API
    type = Column(String(10)) # 'scrim' | 'official' | 'custom'
    date = Column(DateTime(timezone=True))
    map_id = Column(String(50))
    map_name = Column(String(50))
    result = Column(String(1)) # W | L | D
    team_rounds_won = Column(Integer)
    team_rounds_lost = Column(Integer)
    defense_rounds_won = Column(Integer)
    attack_rounds_won = Column(Integer)
    def_pistol = Column(String(1)) # W | L
    att_pistol = Column(String(1)) # W | L
    opponent_name = Column(String(100))
    opponent_tier = Column(String(5)) # T1, T2, T3, T4
    composition = Column(String(200)) # JSON array de 5 agentes guardado como string para SQLite compat, o JSON type
    vod_link = Column(String(500))
    notes = Column(Text)
    data_source = Column(String(10)) # 'ocr' | 'api' | 'manual'
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
    first_bloods = Column(Integer) # FB count
    first_deaths = Column(Integer) # FD count
    hs_pct = Column(Numeric(5,2))
    kast_pct = Column(Numeric(5,2))
    adr = Column(Numeric(7,2))
    score = Column(Integer) # combat score total
    # campos disponibles solo con API (null para scrims OCR)
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
    winning_team = Column(String(10)) # Blue | Red
    end_type = Column(String(20)) # eliminated | detonated | defused | surrendered | time
    ceremony = Column(String(20)) # default | clutch | ace | teamAce | thrifty
    team_buy_type = Column(String(20)) # fullBuy | forceBuy | eco | halfBuy
    opponent_buy_type = Column(String(20))

class RoundEvent(Base):
    __tablename__ = "round_events"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id = Column(Uuid(as_uuid=True), ForeignKey("rounds.id"))
    match_id = Column(Uuid(as_uuid=True), ForeignKey("matches.id"))
    event_type = Column(String(20)) # kill | plant | defuse | revive
    timestamp_ms = Column(Integer) # ms desde inicio de la ronda
    actor_player_id = Column(Uuid(as_uuid=True), ForeignKey("players.id"), nullable=True)
    victim_player_id = Column(Uuid(as_uuid=True), ForeignKey("players.id"), nullable=True)
    weapon = Column(String(50))
    finishing_damage_type = Column(String(20)) # Weapon | Bomb | Melee | Fall
    is_first_blood = Column(Boolean, default=False)
    is_first_death = Column(Boolean, default=False)
    kill_order_in_round = Column(Integer) # 1 = primero en morir, 5 = último
    assistants = Column(JSON) # array de player_ids que asistieron

class ApiCache(Base):
    __tablename__ = "api_cache"
    puuid = Column(String(100), primary_key=True)
    match_id = Column(String(100), primary_key=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
