import { useEffect, useMemo, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Sparkles, UserPlus } from 'lucide-react';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { Badge, roleVariant } from '../components/ui/Badge';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import { chartTooltipStyle, CHART_COLORS } from '../lib/chartTheme';
import type { ComparePlayersResponse, Player } from '../lib/types';

export function Tryouts() {
  const { currentTeamId } = useTeam();
  const [candidates, setCandidates] = useState<Player[]>([]);
  const [main, setMain] = useState<Player[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ComparePlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) return;
    setLoading(true);
    Promise.all([
      api.getPlayers({ team_id: currentTeamId, is_tryout: 'true' }),
      api.getPlayers({ team_id: currentTeamId, is_tryout: 'false' }),
    ])
      .then(([tryouts, mainRoster]) => {
        setCandidates(tryouts);
        setMain(mainRoster);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentTeamId]);

  function toggle(id: string) {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) return [cur[1], cur[2], id];
      return [...cur, id];
    });
  }

  async function runCompare() {
    if (selected.length < 2) return;
    setAiLoading(true);
    setError(null);
    try {
      const r = await api.comparePlayers(selected);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Comparación falló');
    } finally { setAiLoading(false); }
  }

  async function promote(id: string) {
    await api.promotePlayer(id);
    const [t, m] = await Promise.all([
      api.getPlayers({ team_id: currentTeamId!, is_tryout: 'true' }),
      api.getPlayers({ team_id: currentTeamId!, is_tryout: 'false' }),
    ]);
    setCandidates(t);
    setMain(m);
    setSelected((cur) => cur.filter((x) => x !== id));
  }

  const radarData = useMemo(() => {
    if (!result) return [];
    const keys: (keyof ComparePlayersResponse['players'][number])[] = ['avg_acs', 'kd', 'avg_kast', 'avg_adr', 'fb_rate', 'winrate'];
    const norm = (metric: string, v: number) => {
      if (metric === 'avg_acs') return Math.min(100, v / 3);
      if (metric === 'kd') return Math.min(100, v * 50);
      if (metric === 'fb_rate') return Math.min(100, v * 50);
      return Math.min(100, v);
    };
    return keys.map((k) => {
      const row: Record<string, number | string> = { metric: String(k).replace('avg_', '').toUpperCase() };
      result.players.forEach((p, i) => { row[`p${i}`] = norm(String(k), Number(p[k] ?? 0)); });
      return row;
    });
  }, [result]);

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Tryouts</div>
            <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
              <UserPlus size={28} className="text-accent" /> Evaluación de candidatos
            </h1>
            <p className="text-sm text-text-secondary mt-1">Selecciona 2–3 candidatos. La IA genera un veredicto de role-fit.</p>
          </div>
          <button
            onClick={runCompare}
            disabled={selected.length < 2 || aiLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={16} /> {aiLoading ? 'Analizando…' : `Comparar (${selected.length})`}
          </button>
        </header>

        <DataBoundary loading={loading} error={error} empty={!loading && candidates.length === 0} emptyMessage="Sin candidatos tryout todavía.">
          <section className="bg-bg-surface border border-border-default rounded-xl p-6">
            <h2 className="font-display text-xl mb-4">Candidatos ({candidates.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {candidates.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      on ? 'border-accent bg-accent/10' : 'border-border-default bg-bg-elevated hover:border-border-active'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-display text-lg">{p.display_name}</div>
                      {on && <CheckCircle2 size={16} className="text-accent" />}
                    </div>
                    <Badge variant={roleVariant(p.role)}>{p.role || 'flex'}</Badge>
                  </button>
                );
              })}
            </div>
            {main.length > 0 && (
              <div className="mt-4 text-xs text-text-secondary">
                Main roster: {main.map((m) => m.display_name).join(' · ')}
              </div>
            )}
          </section>

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                <h2 className="font-display text-xl mb-4">Radar comparativo</h2>
                <div className="h-[320px]">
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={CHART_COLORS.grid} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: CHART_COLORS.text, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                      {result.players.map((p, i) => (
                        <Radar
                          key={p.player_id}
                          name={p.display_name}
                          dataKey={`p${i}`}
                          stroke={[CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.warning][i]}
                          fill={[CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.warning][i]}
                          fillOpacity={0.18}
                        />
                      ))}
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                  {result.players.map((p, i) => (
                    <div key={p.player_id} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: [CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.warning][i] }} />
                      <span>{p.display_name}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Sparkles size={18} className="text-accent" /> Veredicto IA</h2>
                {result.verdict ? (
                  <div className="space-y-4 text-sm">
                    {result.verdict.recommendation && (
                      <div className="p-3 rounded-lg border border-accent/40 bg-accent/10">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-accent mb-1">Recomendación</div>
                        <div className="font-display text-lg">
                          {result.players.find((p) => p.player_id === result.verdict!.recommendation)?.display_name || '—'}
                        </div>
                      </div>
                    )}
                    <p>{result.verdict.reasoning}</p>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Role-fit</div>
                      <div className="space-y-1">
                        {result.players.map((p) => (
                          <div key={p.player_id} className="flex items-center gap-3 text-xs">
                            <span className="w-32 truncate">{p.display_name}</span>
                            <div className="flex-1 bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${result.verdict!.role_fit_per_player[p.player_id] || 0}%` }} />
                            </div>
                            <span className="w-10 text-right font-mono">{result.verdict!.role_fit_per_player[p.player_id] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {result.players.map((p) => (
                        <button
                          key={p.player_id}
                          onClick={() => promote(p.player_id)}
                          className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-default hover:border-success hover:text-success text-xs transition-colors"
                        >
                          Promote {p.display_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">El veredicto IA requiere GEMINI_API_KEY. Los diffs numéricos están disponibles debajo.</p>
                )}

                {result.diffs.length > 0 && (
                  <div className="mt-4 text-xs">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Diffs</div>
                    <table className="w-full">
                      <tbody>
                        {result.diffs.map((d) => (
                          <tr key={d.metric} className="border-b border-border-default/40">
                            <td className="py-1 font-mono text-text-secondary">{d.metric}</td>
                            {d.values.map((v, i) => <td key={i} className="py-1 font-mono text-right">{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </DataBoundary>
      </div>
    </FadePage>
  );
}
