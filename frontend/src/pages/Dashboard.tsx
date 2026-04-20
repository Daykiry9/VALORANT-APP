import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Flame, Swords, TrendingUp, Target, ArrowUpRight } from 'lucide-react';

import { FadePage } from '../components/motion/FadePage';
import { StaggerGrid } from '../components/motion/StaggerGrid';
import { DataBoundary } from '../components/ui/DataBoundary';
import { KPITile } from '../components/ui/KPITile';
import { ResultPill } from '../components/ui/ResultPill';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { Badge } from '../components/ui/Badge';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import type { MapPoolRow, Match, TeamSummary } from '../lib/types';

export function Dashboard() {
  const { currentTeam, currentTeamId, loading: teamLoading } = useTeam();
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [mapPool, setMapPool] = useState<MapPoolRow[]>([]);
  const [recent, setRecent] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getTeamSummary(currentTeamId),
      api.getTeamMapPool(currentTeamId),
      api.getScrims(8),
    ])
      .then(([s, mp, rc]) => {
        if (cancelled) return;
        setSummary(s);
        setMapPool(mp);
        setRecent(rc);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentTeamId]);

  if (!teamLoading && !currentTeamId) {
    return (
      <div className="p-10">
        <h1 className="font-display text-3xl mb-2">Bienvenido</h1>
        <p className="text-text-secondary">Crea o únete a un equipo para empezar.</p>
      </div>
    );
  }

  return (
    <FadePage>
      <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Command Center</div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {currentTeam?.name || 'Dashboard'}
            </h1>
            {currentTeam && (
              <div className="mt-2 flex items-center gap-2">
                {currentTeam.tag && <Badge variant="accent">{currentTeam.tag}</Badge>}
                {currentTeam.region && <Badge variant="neutral">{currentTeam.region}</Badge>}
                <Badge variant="warning">{currentTeam.plan}</Badge>
              </div>
            )}
          </div>
          <Link
            to="/app/scrims"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Swords size={16} /> Nuevo Scrim
          </Link>
        </header>

        <DataBoundary loading={loading} error={error} empty={!summary}>
          {summary && (
            <>
              <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPITile
                  label="Winrate"
                  value={`${summary.winrate}%`}
                  icon={<TrendingUp size={16} />}
                  accent={summary.winrate >= 50 ? 'success' : 'accent'}
                  hint={`${summary.wins}W-${summary.losses}L-${summary.draws}D`}
                />
                <KPITile
                  label="Streak"
                  value={summary.streak}
                  icon={<Flame size={16} />}
                  accent={summary.streak.startsWith('W') ? 'success' : summary.streak.startsWith('L') ? 'accent' : 'default'}
                />
                <KPITile
                  label="Partidas"
                  value={summary.matches_played}
                  icon={<Activity size={16} />}
                  hint={`${summary.avg_rounds_won.toFixed(1)} - ${summary.avg_rounds_lost.toFixed(1)} avg`}
                />
                <KPITile
                  label="Pistol WR"
                  value={`${summary.pistol_winrate}%`}
                  icon={<Target size={16} />}
                  accent={summary.pistol_winrate >= 55 ? 'success' : 'warning'}
                />
              </StaggerGrid>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <section className="lg:col-span-2 bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Map Pool</div>
                      <h2 className="font-display text-xl mt-0.5">Efectividad por mapa</h2>
                    </div>
                  </div>
                  {mapPool.length === 0 ? (
                    <div className="text-sm text-text-secondary py-8 text-center">Sin datos suficientes.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mapPool.slice(0, 6).map((m) => (
                        <div key={m.map_name} className="relative overflow-hidden rounded-lg border border-border-default bg-bg-elevated group">
                          <MapThumbnail mapName={m.map_name} className="w-full h-20" />
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-display text-base">{m.map_name}</div>
                              <div className={`font-mono text-xs ${m.winrate >= 50 ? 'text-success' : 'text-accent'}`}>
                                {m.winrate}%
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-text-secondary mt-0.5">
                              {m.wins}W · {m.games - m.wins}L · Δ {m.avg_round_diff.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <aside className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Recent</div>
                      <h2 className="font-display text-xl mt-0.5">Últimas partidas</h2>
                    </div>
                    <Link to="/app/scrims" className="text-text-secondary hover:text-accent transition-colors">
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {recent.length === 0 && <div className="text-sm text-text-secondary py-4 text-center">Sin scrims todavía.</div>}
                    {recent.map((m) => (
                      <Link
                        key={m.id}
                        to={`/app/matches/${m.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border-default hover:border-border-active bg-bg-elevated transition-colors"
                      >
                        <ResultPill result={m.result} score={`${m.team_rounds_won ?? '-'}-${m.team_rounds_lost ?? '-'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.map_name || '—'}</div>
                          <div className="text-xs text-text-secondary truncate">vs {m.opponent_name || '—'}</div>
                        </div>
                        {m.opponent_tier && <Badge variant="neutral">{m.opponent_tier}</Badge>}
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            </>
          )}
        </DataBoundary>
      </div>
    </FadePage>
  );
}
