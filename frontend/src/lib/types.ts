// Shared TypeScript types — mirror of backend Pydantic schemas.

export type Role = 'duelist' | 'initiator' | 'controller' | 'sentinel' | 'flex';
export type Result = 'W' | 'L' | 'D';
export type Tier = 'T1' | 'T2' | 'T3' | 'T4';
export type PlanTier = 'free' | 'rising' | 'premier' | 'franchise';

export interface Team {
  id: string;
  name: string | null;
  tag: string | null;
  region: string | null;
  plan: PlanTier;
}

export interface Player {
  id: string;
  team_id: string | null;
  display_name: string | null;
  riot_id: string | null;
  role: Role | string | null;
  role_inferred: boolean;
  rso_linked: boolean;
  is_tryout: boolean;
  active: boolean;
}

export interface MatchPlayerStat {
  id: string;
  match_id: string;
  player_id: string | null;
  agent: string | null;
  acs: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  first_bloods: number | null;
  first_deaths: number | null;
  hs_pct: number | null;
  kast_pct: number | null;
  adr: number | null;
}

export interface Match {
  id: string;
  team_id: string | null;
  type: string | null;
  date: string | null;
  map_name: string | null;
  result: Result | null;
  team_rounds_won: number | null;
  team_rounds_lost: number | null;
  opponent_name: string | null;
  opponent_tier: Tier | null;
  composition: string | null;
  vod_link: string | null;
  data_source: string | null;
}

export interface MatchDetail extends Match {
  players: MatchPlayerStat[];
  notes: string | null;
}

// ---------- Analytics ----------

export interface PlayerSummary {
  player_id: string;
  display_name: string;
  role: string | null;
  is_tryout: boolean;
  matches_played: number;
  wins: number;
  losses: number;
  winrate: number;
  avg_acs: number;
  kd: number;
  avg_kast: number;
  avg_adr: number;
  avg_hs_pct: number;
  fb_rate: number;
  fd_rate: number;
}

export interface PlayerByAgentRow {
  agent: string;
  games: number;
  wins: number;
  winrate: number;
  avg_acs: number;
  kd: number;
}

export interface PlayerByMapRow {
  map_name: string;
  games: number;
  wins: number;
  winrate: number;
  avg_acs: number;
  kd: number;
}

export interface PlayerTrendPoint {
  match_id: string;
  date: string | null;
  map_name: string | null;
  result: Result | null;
  acs: number;
  kd: number;
  kast: number;
  adr: number;
  hs_pct: number;
}

export interface DeathOrderStats {
  total_rounds: number;
  first_death_rate: number;
  first_blood_rate: number;
  survival_rate: number;
  fd_count: number;
  fb_count: number;
}

export interface BenchmarkPercentiles {
  p25: number;
  p50: number;
  p75: number;
}

export interface RoleBenchmark {
  role: string;
  sample_size: number;
  source: 'computed' | 'hardcoded';
  acs: BenchmarkPercentiles;
  kd: BenchmarkPercentiles;
  kast: BenchmarkPercentiles;
  adr: BenchmarkPercentiles;
  hs_pct: BenchmarkPercentiles;
  fb_rate: BenchmarkPercentiles;
}

export interface TeamSummary {
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
  streak: string;
  avg_rounds_won: number;
  avg_rounds_lost: number;
  pistol_winrate: number;
  last_match_id: string | null;
}

export interface MapPoolRow {
  map_name: string;
  games: number;
  wins: number;
  winrate: number;
  avg_round_diff: number;
}

export interface SideWinrate {
  attack_rounds_won: number;
  attack_rounds_played: number;
  attack_winrate: number;
  defense_rounds_won: number;
  defense_rounds_played: number;
  defense_winrate: number;
}

export interface CompositionRow {
  composition: string;
  games: number;
  wins: number;
  winrate: number;
}

export interface OpponentTierRow {
  tier: Tier;
  games: number;
  wins: number;
  winrate: number;
}

// ---------- Compare / Tryouts ----------

export interface PlayerStatDiff {
  metric: string;
  values: number[];
  delta_vs_best: number;
}

export interface TryoutVerdict {
  recommendation: string | null;
  reasoning: string;
  pairwise_matrix: string[][];
  role_fit_per_player: Record<string, number>;
}

export interface ComparePlayersResponse {
  players: PlayerSummary[];
  diffs: PlayerStatDiff[];
  verdict: TryoutVerdict | null;
}

// ---------- AI ----------

export interface MatchInsightContent {
  main_problem: string;
  standout_player: string;
  next_action: string;
  weaknesses_detected: string[];
  composition_read: string;
  eco_read: string;
  confidence: number;
}

export interface MatchInsight {
  id: string;
  match_id: string;
  prompt_type: string;
  version: number;
  model: string;
  content: MatchInsightContent;
  generated_at: string;
}

export interface PlayerWeaknessReport {
  top_weaknesses: string[];
  top_strengths: string[];
  role_fit_score: number;
  recommended_drills: string[];
}

export interface CompositionRead {
  synergy: string;
  missing_roles: string[];
  meta_suggestions: string[];
}

// ---------- Scouting ----------

export interface OpponentListRow {
  name: string;
  tier: Tier | null;
  games: number;
  wins: number;
  winrate: number;
  last_faced: string | null;
}

export interface ScoutingMapRow {
  map_name: string;
  games: number;
  wins: number;
  winrate: number;
  avg_round_diff: number;
}

export interface ScoutingPayload {
  opponent_name: string;
  tier: Tier | null;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
  avg_round_diff: number;
  by_map: ScoutingMapRow[];
  pistol_pattern: { def_won: number; def_lost: number; att_won: number; att_lost: number };
  recent_matches: {
    match_id: string;
    date: string | null;
    map_name: string | null;
    result: Result | null;
    score: string;
    composition: string | null;
  }[];
}

export interface ScoutingAIReport {
  threat_level: 'low' | 'medium' | 'high' | 'elite';
  map_priority: string[];
  map_to_ban: string[];
  expected_playstyle: string;
  detected_weaknesses: string[];
  gameplan: string[];
  pistol_read: string;
  confidence: number;
}

// ---------- OCR ----------

export interface OcrPlayerRow {
  name: string | null;
  agent: string | null;
  acs: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  econ: number | null;
  first_bloods: number | null;
  plants: number | null;
  defuses: number | null;
}

export interface OcrScoreboard {
  map_name: string | null;
  our_score: number | null;
  rival_score: number | null;
  scoreboard: OcrPlayerRow[];
}

// ---------- Error shape ----------

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
    details?: Record<string, unknown>;
  };
}
