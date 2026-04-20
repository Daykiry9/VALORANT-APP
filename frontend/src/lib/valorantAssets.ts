// Helpers for fetching Valorant branding (agent portraits, map minimaps/splashes)
// from the community valorant-api.com CDN. Results are cached in-memory for the session.

type AgentEntry = {
  uuid: string;
  displayName: string;
  displayIcon: string;
  fullPortraitV2: string | null;
  fullPortrait: string | null;
  bustPortrait: string | null;
  role: { displayName: string } | null;
  developerName: string;
};

type MapEntry = {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  splash: string | null;
  listViewIcon: string | null;
  mapUrl: string;
};

const BASE = 'https://valorant-api.com/v1';

let agentsCache: Map<string, AgentEntry> | null = null;  // key: lowercased displayName
let mapsCache: Map<string, MapEntry> | null = null;       // key: lowercased displayName

export async function preloadAgents(): Promise<Map<string, AgentEntry>> {
  if (agentsCache) return agentsCache;
  const res = await fetch(`${BASE}/agents?isPlayableCharacter=true`);
  if (!res.ok) {
    agentsCache = new Map();
    return agentsCache;
  }
  const json: { data: AgentEntry[] } = await res.json();
  const map = new Map<string, AgentEntry>();
  for (const a of json.data) map.set(a.displayName.toLowerCase(), a);
  agentsCache = map;
  return map;
}

export async function preloadMaps(): Promise<Map<string, MapEntry>> {
  if (mapsCache) return mapsCache;
  const res = await fetch(`${BASE}/maps`);
  if (!res.ok) {
    mapsCache = new Map();
    return mapsCache;
  }
  const json: { data: MapEntry[] } = await res.json();
  const map = new Map<string, MapEntry>();
  for (const m of json.data) map.set(m.displayName.toLowerCase(), m);
  mapsCache = map;
  return map;
}

export async function getAgentPortrait(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const cache = await preloadAgents();
  const a = cache.get(name.toLowerCase());
  return a?.fullPortraitV2 || a?.fullPortrait || a?.bustPortrait || a?.displayIcon || null;
}

export async function getAgentIcon(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const cache = await preloadAgents();
  return cache.get(name.toLowerCase())?.displayIcon ?? null;
}

export async function getAgentRole(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const cache = await preloadAgents();
  return cache.get(name.toLowerCase())?.role?.displayName?.toLowerCase() ?? null;
}

export async function getMapSplash(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const cache = await preloadMaps();
  return cache.get(name.toLowerCase())?.splash ?? null;
}

export async function getMapMinimap(name?: string | null): Promise<string | null> {
  if (!name) return null;
  const cache = await preloadMaps();
  return cache.get(name.toLowerCase())?.displayIcon ?? null;
}

export const ROLE_COLORS: Record<string, string> = {
  duelist: '#FF4655',
  initiator: '#FFB038',
  controller: '#B57EFF',
  sentinel: '#00D4AA',
  flex: '#7A7A8C',
};

export function roleColor(role?: string | null): string {
  if (!role) return ROLE_COLORS.flex;
  return ROLE_COLORS[role.toLowerCase()] || ROLE_COLORS.flex;
}
