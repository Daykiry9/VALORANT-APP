import { supabase } from './supabase';
import type {
  ComparePlayersResponse,
  CompositionRead,
  CompositionRow,
  DeathOrderStats,
  MapPoolRow,
  Match,
  MatchDetail,
  MatchInsight,
  OpponentTierRow,
  Player,
  PlayerByAgentRow,
  PlayerByMapRow,
  PlayerSummary,
  PlayerTrendPoint,
  PlayerWeaknessReport,
  RoleBenchmark,
  SideWinrate,
  Team,
  TeamSummary,
} from './types';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, requestId?: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string; request_id?: string; details?: Record<string, unknown> } } | { detail?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON body
    }
    const err = (payload as { error?: { code?: string; message?: string; request_id?: string; details?: Record<string, unknown> } }).error;
    if (err) {
      throw new ApiError(res.status, err.code || 'error', err.message || 'Request failed', err.request_id, err.details);
    }
    const detail = (payload as { detail?: string }).detail;
    throw new ApiError(res.status, 'http_error', detail || `HTTP ${res.status}`);
  }

  // Allow 204 / empty
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadForm<T>(path: string, form: FormData): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form, headers });
  if (!res.ok) {
    throw new ApiError(res.status, 'upload_error', `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  base: BASE,

  // Health
  health: () => req<{ status: string }>('/api/health'),

  // Teams
  getTeams: () => req<Team[]>('/api/teams/'),
  getTeam: (id: string) => req<Team>(`/api/teams/${id}`),
  createTeam: (payload: { name: string; tag: string; region: string }) =>
    req<Team>('/api/teams/', { method: 'POST', body: JSON.stringify(payload) }),

  // Players
  getPlayers: (opts?: { team_id?: string; is_tryout?: 'true' | 'false' | 'all' }) => {
    const q = new URLSearchParams();
    if (opts?.team_id) q.set('team_id', opts.team_id);
    if (opts?.is_tryout) q.set('is_tryout', opts.is_tryout);
    const qs = q.toString();
    return req<Player[]>(`/api/players/${qs ? `?${qs}` : ''}`);
  },
  getPlayer: (id: string) => req<Player>(`/api/players/${id}`),
  createPlayer: (payload: { display_name: string; riot_id: string; role: string; team_id?: string; is_tryout?: boolean }) =>
    req<Player>('/api/players/', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlayer: (id: string, payload: Partial<Pick<Player, 'display_name' | 'role' | 'is_tryout' | 'active'>>) =>
    req<Player>(`/api/players/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  promotePlayer: (id: string) => req<Player>(`/api/players/${id}/promote`, { method: 'PATCH' }),
  demotePlayer: (id: string) => req<Player>(`/api/players/${id}/demote`, { method: 'PATCH' }),
  deletePlayer: (id: string) => req<{ success: boolean }>(`/api/players/${id}`, { method: 'DELETE' }),

  // Scrims / matches
  getScrims: (limit = 50) => req<Match[]>(`/api/scrims/?limit=${limit}`),
  createScrim: (payload: unknown) => req<{ success: boolean; match_id: string }>('/api/scrims/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  uploadScoreboard: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return uploadForm<{ success: boolean; data?: unknown; error?: string }>('/api/scrims/upload-scoreboard', form);
  },
  getMatch: (id: string) => req<MatchDetail>(`/api/scrims/${id}`),  // backend route may need adding

  // Analytics - player
  getPlayerSummary: (id: string) => req<PlayerSummary>(`/api/analytics/player/${id}/summary`),
  getPlayerByAgent: (id: string) => req<PlayerByAgentRow[]>(`/api/analytics/player/${id}/by-agent`),
  getPlayerByMap: (id: string) => req<PlayerByMapRow[]>(`/api/analytics/player/${id}/by-map`),
  getPlayerTrend: (id: string, window = 20) => req<PlayerTrendPoint[]>(`/api/analytics/player/${id}/trend?window=${window}`),
  getPlayerDeathOrder: (id: string) => req<DeathOrderStats>(`/api/analytics/player/${id}/death-order`),
  getPlayerBenchmarks: (id: string, tier: 'T1' | 'T2' | 'T3' = 'T1') =>
    req<RoleBenchmark>(`/api/analytics/player/${id}/benchmarks?tier=${tier}`),

  // Analytics - team
  getTeamSummary: (id: string) => req<TeamSummary>(`/api/analytics/team/${id}/summary`),
  getTeamMapPool: (id: string) => req<MapPoolRow[]>(`/api/analytics/team/${id}/map-pool`),
  getTeamSideWinrate: (id: string) => req<SideWinrate>(`/api/analytics/team/${id}/side-winrate`),
  getTeamComposition: (id: string) => req<CompositionRow[]>(`/api/analytics/team/${id}/composition`),
  getTeamOpponentTier: (id: string) => req<OpponentTierRow[]>(`/api/analytics/team/${id}/opponent-tier`),

  // Compare / tryouts
  comparePlayers: (player_ids: string[]) =>
    req<ComparePlayersResponse>('/api/analytics/compare', {
      method: 'POST',
      body: JSON.stringify({ player_ids }),
    }),

  // AI
  generateMatchInsight: (matchId: string) => req<MatchInsight>(`/api/ai/match/${matchId}/insights`, { method: 'POST' }),
  getMatchInsight: (matchId: string) => req<MatchInsight>(`/api/ai/match/${matchId}/insights`),
  getMatchInsightHistory: (matchId: string) => req<MatchInsight[]>(`/api/ai/match/${matchId}/insights/history`),
  getPlayerWeaknessReport: (playerId: string) => req<PlayerWeaknessReport>(`/api/ai/player/${playerId}/weakness-report`),
  getCompositionRead: (teamId: string) => req<CompositionRead>(`/api/ai/team/${teamId}/composition-read`),

  // Reports
  exportMatchPDF: (matchId: string) => window.open(`${BASE}/api/reports/match/${matchId}/pdf`, '_blank'),
};
