import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Team } from '../lib/types';

interface TeamContextValue {
  teams: Team[];
  currentTeam: Team | null;
  currentTeamId: string | null;
  setCurrentTeamId: (id: string) => void;
  loading: boolean;
  reload: () => Promise<void>;
}

const TeamContext = createContext<TeamContextValue | null>(null);

const STORAGE_KEY = 'val:currentTeamId';

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY);
    return null;
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getTeams();
      setTeams(list);
      setCurrentTeamIdState((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCurrentTeamId = useCallback((id: string) => {
    setCurrentTeamIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const currentTeam = useMemo(
    () => teams.find((t) => t.id === currentTeamId) ?? null,
    [teams, currentTeamId],
  );

  const value = useMemo(
    () => ({ teams, currentTeam, currentTeamId, setCurrentTeamId, loading, reload: load }),
    [teams, currentTeam, currentTeamId, setCurrentTeamId, loading, load],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used inside <TeamProvider>');
  return ctx;
}
