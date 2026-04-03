const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Scrims
  getScrims: (limit = 50) => req<any[]>(`/api/scrims/?limit=${limit}`),
  createScrim: (data: any) => req('/api/scrims/', {
    method: 'POST', body: JSON.stringify(data)
  }),
  uploadScoreboard: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/api/scrims/upload-scoreboard`, {
      method: 'POST', body: form
    }).then(r => r.json());
  },
  
  // Analytics
  getPlayerDeathOrder: (id: string) => req(`/api/analytics/player/${id}/death-order`),
  getPlayerBenchmarks: (id: string) => req(`/api/analytics/player/${id}/benchmarks`),
  
  // AI
  getMatchInsight: (id: string) => req(`/api/ai/match/${id}/insights`, { method: 'POST' }),
  
  // Reports
  exportPDF: (matchId: string) => window.open(`${BASE}/api/reports/match/${matchId}/pdf`, '_blank'),
  
  // Teams & Players
  getTeams: () => req<any[]>('/api/teams/'),
  getPlayers: (teamId?: string) => req<any[]>(`/api/players/${teamId ? `?team_id=${teamId}` : ''}`),
};
