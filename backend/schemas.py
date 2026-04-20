"""Pydantic request/response schemas. Every route response should be annotated."""
from __future__ import annotations

from datetime import datetime
from typing import Generic, List, Literal, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


# ---------- Base config ----------

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Pagination ----------

class PaginatedList(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int = 1
    page_size: int = 50


# ---------- Auth ----------

class AuthContextOut(BaseModel):
    user_id: UUID
    email: Optional[str]
    team_id: Optional[UUID]
    plan: str
    role: str


# ---------- Team ----------

class TeamOut(ORMModel):
    id: UUID
    name: Optional[str] = None
    tag: Optional[str] = None
    region: Optional[str] = None
    plan: str = "free"


class TeamCreate(BaseModel):
    name: str
    tag: str
    region: str


# ---------- Player ----------

class PlayerOut(ORMModel):
    id: UUID
    team_id: Optional[UUID] = None
    display_name: Optional[str] = None
    riot_id: Optional[str] = None
    role: Optional[str] = None
    role_inferred: bool = True
    rso_linked: bool = False
    is_tryout: bool = False
    active: bool = True


class PlayerCreate(BaseModel):
    display_name: str
    riot_id: str
    role: str
    team_id: Optional[UUID] = None
    is_tryout: bool = False


class PlayerUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    is_tryout: Optional[bool] = None
    active: Optional[bool] = None


# ---------- Match & stats ----------

class MatchPlayerStatOut(ORMModel):
    id: UUID
    match_id: UUID
    player_id: Optional[UUID] = None
    agent: Optional[str] = None
    acs: Optional[int] = None
    kills: Optional[int] = None
    deaths: Optional[int] = None
    assists: Optional[int] = None
    first_bloods: Optional[int] = None
    first_deaths: Optional[int] = None
    hs_pct: Optional[float] = None
    kast_pct: Optional[float] = None
    adr: Optional[float] = None


class MatchOut(ORMModel):
    id: UUID
    team_id: Optional[UUID] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    map_name: Optional[str] = None
    result: Optional[str] = None
    team_rounds_won: Optional[int] = None
    team_rounds_lost: Optional[int] = None
    opponent_name: Optional[str] = None
    opponent_tier: Optional[str] = None
    composition: Optional[str] = None
    vod_link: Optional[str] = None
    data_source: Optional[str] = None


class MatchDetailOut(MatchOut):
    players: List[MatchPlayerStatOut] = []
    notes: Optional[str] = None


# ---------- Scrim ingestion ----------

class ScrimPlayerRow(BaseModel):
    display_name: str
    agent: Optional[str] = None
    acs: Optional[int] = 0
    kills: Optional[int] = 0
    deaths: Optional[int] = 0
    assists: Optional[int] = 0
    first_bloods: Optional[int] = 0
    first_deaths: Optional[int] = 0
    hs_pct: Optional[float] = 0
    kast_pct: Optional[float] = 0
    adr: Optional[float] = 0
    plants: Optional[int] = 0
    defuses: Optional[int] = 0


class ScrimCreate(BaseModel):
    team_id: Optional[UUID] = None
    match_date: datetime
    vod_link: Optional[str] = None
    opponent_name: str
    opponent_tier: Optional[str] = None
    map_name: str
    result: Literal["W", "L", "D"]
    team_rounds_won: int
    team_rounds_lost: int
    defense_rounds_won: Optional[int] = 0
    attack_rounds_won: Optional[int] = 0
    def_pistol: Optional[str] = None
    att_pistol: Optional[str] = None
    composition: str
    notes: Optional[str] = None
    players_data: List[ScrimPlayerRow]


# ---------- Analytics DTOs ----------

class BenchmarkPercentiles(BaseModel):
    p25: float
    p50: float
    p75: float


class RoleBenchmark(BaseModel):
    role: str
    sample_size: int
    source: Literal["computed", "hardcoded"]
    acs: BenchmarkPercentiles
    kd: BenchmarkPercentiles
    kast: BenchmarkPercentiles
    adr: BenchmarkPercentiles
    hs_pct: BenchmarkPercentiles
    fb_rate: BenchmarkPercentiles


class DeathOrderStats(BaseModel):
    total_rounds: int
    first_death_rate: float
    first_blood_rate: float
    survival_rate: float
    fd_count: int
    fb_count: int


class PlayerSummary(BaseModel):
    player_id: UUID
    display_name: str
    role: Optional[str] = None
    is_tryout: bool = False
    matches_played: int
    wins: int
    losses: int
    winrate: float
    avg_acs: float
    kd: float
    avg_kast: float
    avg_adr: float
    avg_hs_pct: float
    fb_rate: float
    fd_rate: float


class PlayerByAgentRow(BaseModel):
    agent: str
    games: int
    wins: int
    winrate: float
    avg_acs: float
    kd: float


class PlayerByMapRow(BaseModel):
    map_name: str
    games: int
    wins: int
    winrate: float
    avg_acs: float
    kd: float


class PlayerTrendPoint(BaseModel):
    match_id: UUID
    date: Optional[datetime] = None
    map_name: Optional[str] = None
    result: Optional[str] = None
    acs: float
    kd: float
    kast: float
    adr: float
    hs_pct: float


class TeamSummary(BaseModel):
    team_id: UUID
    matches_played: int
    wins: int
    losses: int
    draws: int
    winrate: float
    streak: str  # e.g. "W3", "L2"
    avg_rounds_won: float
    avg_rounds_lost: float
    pistol_winrate: float
    last_match_id: Optional[UUID] = None


class MapPoolRow(BaseModel):
    map_name: str
    games: int
    wins: int
    winrate: float
    avg_round_diff: float


class SideWinrate(BaseModel):
    attack_rounds_won: int
    attack_rounds_played: int
    attack_winrate: float
    defense_rounds_won: int
    defense_rounds_played: int
    defense_winrate: float


class CompositionRow(BaseModel):
    composition: str  # JSON-encoded list of 5 agent names
    games: int
    wins: int
    winrate: float


class OpponentTierRow(BaseModel):
    tier: str
    games: int
    wins: int
    winrate: float


# ---------- Compare / Tryout ----------

class ComparePlayersRequest(BaseModel):
    player_ids: List[UUID] = Field(min_length=2, max_length=3)


class PlayerStatDiff(BaseModel):
    metric: str
    values: List[float]
    delta_vs_best: float


class TryoutVerdict(BaseModel):
    recommendation: Optional[UUID] = None
    reasoning: str
    pairwise_matrix: List[List[str]]
    role_fit_per_player: dict[str, int]  # player_id -> 0..100


class ComparePlayersResponse(BaseModel):
    players: List[PlayerSummary]
    diffs: List[PlayerStatDiff]
    verdict: Optional[TryoutVerdict] = None


# ---------- AI insights ----------

class MatchInsightContent(BaseModel):
    main_problem: str
    standout_player: str
    next_action: str
    weaknesses_detected: List[str] = []
    composition_read: str = ""
    eco_read: str = ""
    confidence: float = 0.5


class MatchInsightOut(BaseModel):
    id: UUID
    match_id: UUID
    prompt_type: str
    version: int
    model: str
    content: MatchInsightContent
    generated_at: datetime


class PlayerWeaknessReport(BaseModel):
    top_weaknesses: List[str]
    top_strengths: List[str]
    role_fit_score: int  # 0..100
    recommended_drills: List[str]


class CompositionRead(BaseModel):
    synergy: str
    missing_roles: List[str]
    meta_suggestions: List[str]


# ---------- Error shape ----------

class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str
    details: dict = {}


class ErrorResponse(BaseModel):
    error: ErrorBody
