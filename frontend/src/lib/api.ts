const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  // Scrims
  getScrims: (limit = 50) => apiFetch<any[]>(`/api/scrims/?limit=${limit}`),
  getMatch: (matchId: string) => apiFetch<any>(`/api/match/${matchId}`),
  createScrim: (data: any) => apiFetch('/api/scrims/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  uploadScoreboard: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/scrims/upload-scoreboard`, {
      method: 'POST',
      body: form,
    }).then(r => r.json());
  },
  
  // Analytics
  getTeamStats: (teamId: string) => apiFetch(`/api/analytics/team/${teamId}`),
  getPlayerStats: (playerId: string) => apiFetch(`/api/analytics/player/${playerId}`),
  
  // AI
  getMatchInsight: (matchId: string) => apiFetch<{insight: string}>(`/api/ai/match/${matchId}/insight`),
  
  // PDF
  getMatchReport: (matchId: string) => `${API_BASE}/api/reports/match/${matchId}/pdf`
};
