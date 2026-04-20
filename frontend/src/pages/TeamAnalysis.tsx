import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Shield, Sparkles, Swords } from 'lucide-react';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { KPITile } from '../components/ui/KPITile';
import { Badge } from '../components/ui/Badge';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import { chartAxisProps, chartGridProps, chartTooltipStyle, CHART_COLORS } from '../lib/chartTheme';
import type { CompositionRead, CompositionRow, MapPoolRow, OpponentTierRow, SideWinrate, TeamSummary } from '../lib/types';

export function TeamAnalysis() {
  const { currentTeam, currentTeamId } = useTeam();
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [mapPool, setMapPool] = useState<MapPoolRow[]>([]);
  const [sides, setSides] = useState<SideWinrate | null>(null);
  const [comps, setComps] = useState<CompositionRow[]>([]);
  const [tiers, setTiers] = useState<OpponentTierRow[]>([]);
  const [read, setRead] = useState<CompositionRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getTeamSummary(currentTeamId),
      api.getTeamMapPool(currentTeamId),
      api.getTeamSideWinrate(currentTeamId),
      api.getTeamComposition(currentTeamId),
      api.getTeamOpponentTier(currentTeamId),
    ])
      .then(([s, mp, sw, cp, ot]) => {
        if (cancelled) return;
        setSummary(s); setMapPool(mp); setSides(sw); setComps(cp); setTiers(ot);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentTeamId]);

  async function runCompositionRead() {
    if (!currentTeamId) return;
    setAiLoading(true);
    try {
      const r = await api.getCompositionRead(currentTeamId);
      setRead(r);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI failed';
      setError(message);
    } finally { setAiLoading(false); }
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Team Intel</div>
          <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
            <Shield size={28} className="text-accent" />
            {currentTeam?.name || 'Team Analysis'}
          </h1>
        </header>

        <DataBoundary loading={loading} error={error} empty={!summary}>
          {summary && sides && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPITile label="Winrate" value={`${summary.winrate}%`} accent={summary.winrate >= 50 ? 'success' : 'accent'} hint={`${summary.matches_played} partidas`} />
                <KPITile label="Racha" value={summary.streak} accent={summary.streak.startsWith('W') ? 'success' : 'accent'} />
                <KPITile label="ATK WR" value={`${sides.attack_winrate}%`} hint={`${sides.attack_rounds_won}/${sides.attack_rounds_played}`} />
                <KPITile label="DEF WR" value={`${sides.defense_winrate}%`} hint={`${sides.defense_rounds_won}/${sides.defense_rounds_played}`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl">Map pool</h2>
                    <Badge variant="neutral">{mapPool.length} mapas</Badge>
                  </div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mapPool}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="map_name" {...chartAxisProps} />
                        <YAxis {...chartAxisProps} domain={[0, 100]} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="winrate" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mapPool.slice(0, 6).map((m) => (
                      <div key={m.map_name} className="flex items-center gap-2 p-2 rounded border border-border-default bg-bg-elevated">
                        <MapThumbnail mapName={m.map_name} className="w-10 h-7" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.map_name}</div>
                          <div className="text-[10px] font-mono text-text-secondary">
                            {m.games}G · {m.wins}W · Δ {m.avg_round_diff.toFixed(1)}
                          </div>
                        </div>
                        <div className={`font-mono text-xs ${m.winrate >= 50 ? 'text-success' : 'text-accent'}`}>{m.winrate}%</div>
                      </div>
                    ))}
                  </div>
                </section>

                <aside className="bg-bg-surface border border-border-default rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl flex items-center gap-2">
                      <Sparkles size={18} className="text-accent" /> Composition Read
                    </h2>
                    <button
                      onClick={runCompositionRead}
                      disabled={aiLoading}
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs hover:bg-accent/90 disabled:opacity-60"
                    >
                      {aiLoading ? 'Analizando…' : 'Generar'}
                    </button>
                  </div>
                  {!read ? (
                    <p className="text-sm text-text-secondary">Corre el análisis para ver synergies y sugerencias de meta.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Synergy</div>
                        <p>{read.synergy}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Missing roles</div>
                        <div className="flex flex-wrap gap-1">
                          {read.missing_roles.map((r) => <Badge key={r} variant="warning">{r}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Meta suggestions</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {read.meta_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </aside>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                    <Swords size={18} className="text-accent" /> vs Tier
                  </h2>
                  {tiers.length === 0 ? (
                    <div className="py-4 text-center text-text-secondary text-sm">Sin datos de tier del rival todavía.</div>
                  ) : (
                    <div className="space-y-2">
                      {tiers.map((t) => (
                        <div key={t.tier} className="flex items-center gap-3">
                          <div className="w-8 text-center"><Badge variant="neutral">{t.tier}</Badge></div>
                          <div className="flex-1 bg-bg-elevated rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${Math.min(100, t.winrate)}%` }} />
                          </div>
                          <div className="text-xs font-mono text-text-secondary w-20 text-right">{t.wins}/{t.games} · {t.winrate}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <h2 className="font-display text-xl mb-4">Top composiciones</h2>
                  {comps.length === 0 ? (
                    <div className="py-4 text-center text-text-secondary text-sm">Aún sin suficiente data.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] font-mono uppercase tracking-wider text-text-secondary border-b border-border-default">
                          <th className="text-left py-2 font-normal">Composición</th>
                          <th className="text-left py-2 font-normal">Games</th>
                          <th className="text-left py-2 font-normal">WR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comps.slice(0, 8).map((c) => (
                          <tr key={c.composition} className="border-b border-border-default/40 last:border-0">
                            <td className="py-2 font-mono text-xs text-text-secondary truncate max-w-[220px]">{c.composition}</td>
                            <td className="py-2 font-mono">{c.games}</td>
                            <td className={`py-2 font-mono ${c.winrate >= 50 ? 'text-success' : 'text-accent'}`}>{c.winrate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </div>
            </>
          )}
        </DataBoundary>
      </div>
    </FadePage>
  );
}
