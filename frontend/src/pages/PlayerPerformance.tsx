import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, Sparkles, User } from 'lucide-react';

import { FadePage } from '../components/motion/FadePage';
import { StaggerGrid } from '../components/motion/StaggerGrid';
import { DataBoundary } from '../components/ui/DataBoundary';
import { KPITile } from '../components/ui/KPITile';
import { AgentPortrait } from '../components/ui/AgentPortrait';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { Badge, roleVariant } from '../components/ui/Badge';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import { chartAxisProps, chartGridProps, chartTooltipStyle, CHART_COLORS } from '../lib/chartTheme';
import type { DeathOrderStats, Player, PlayerByAgentRow, PlayerByMapRow, PlayerSummary, PlayerTrendPoint, PlayerWeaknessReport, RoleBenchmark } from '../lib/types';

export function PlayerPerformance() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { currentTeamId } = useTeam();

  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [byAgent, setByAgent] = useState<PlayerByAgentRow[]>([]);
  const [byMap, setByMap] = useState<PlayerByMapRow[]>([]);
  const [trend, setTrend] = useState<PlayerTrendPoint[]>([]);
  const [bench, setBench] = useState<RoleBenchmark | null>(null);
  const [death, setDeath] = useState<DeathOrderStats | null>(null);
  const [weakness, setWeakness] = useState<PlayerWeaknessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) return;
    api.getPlayers({ team_id: currentTeamId, is_tryout: 'all' })
      .then((list) => {
        setPlayers(list);
        if (!playerId && list.length > 0) navigate(`/app/players/${list[0].id}`, { replace: true });
      })
      .catch((e: Error) => setError(e.message));
  }, [currentTeamId, playerId, navigate]);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getPlayerSummary(playerId),
      api.getPlayerByAgent(playerId),
      api.getPlayerByMap(playerId),
      api.getPlayerTrend(playerId, 20),
      api.getPlayerBenchmarks(playerId),
      api.getPlayerDeathOrder(playerId).catch(() => null),
    ])
      .then(([s, a, m, t, b, d]) => {
        if (cancelled) return;
        setSummary(s); setByAgent(a); setByMap(m); setTrend(t); setBench(b); setDeath(d);
        setWeakness(null);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [playerId]);

  const currentPlayer = useMemo(() => players.find((p) => p.id === playerId), [players, playerId]);

  const deltaVsP50 = useMemo(() => {
    if (!summary || !bench) return null;
    const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);
    return {
      acs: pct(summary.avg_acs, bench.acs.p50),
      kd: pct(summary.kd, bench.kd.p50),
      kast: pct(summary.avg_kast, bench.kast.p50),
      adr: pct(summary.avg_adr, bench.adr.p50),
    };
  }, [summary, bench]);

  async function runWeaknessReport() {
    if (!playerId) return;
    setAiLoading(true);
    try {
      const r = await api.getPlayerWeaknessReport(playerId);
      setWeakness(r);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI request failed';
      setError(message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Player Intel</div>
            <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
              <User size={28} className="text-accent" />
              {currentPlayer?.display_name || 'Player Stats'}
            </h1>
            {currentPlayer && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={roleVariant(currentPlayer.role)}>{currentPlayer.role || 'flex'}</Badge>
                <Badge variant={currentPlayer.is_tryout ? 'status-tryout' : 'status-main'}>
                  {currentPlayer.is_tryout ? 'Tryout' : 'Main roster'}
                </Badge>
                {currentPlayer.rso_linked && <Badge variant="success">RSO Linked</Badge>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/app/players/${p.id}`)}
                className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                  p.id === playerId
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-default text-text-secondary hover:border-border-active'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </header>

        <DataBoundary loading={loading} error={error} empty={!summary}>
          {summary && bench && (
            <>
              <StaggerGrid className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KPITile label="ACS" value={Math.round(summary.avg_acs)} delta={deltaVsP50 ? { value: deltaVsP50.acs } : null} hint={`p50 rol ${Math.round(bench.acs.p50)}`} />
                <KPITile label="K/D" value={summary.kd.toFixed(2)} delta={deltaVsP50 ? { value: deltaVsP50.kd } : null} hint={`p50 ${bench.kd.p50.toFixed(2)}`} />
                <KPITile label="KAST" value={`${Math.round(summary.avg_kast)}%`} delta={deltaVsP50 ? { value: deltaVsP50.kast } : null} hint={`p50 ${Math.round(bench.kast.p50)}%`} />
                <KPITile label="ADR" value={Math.round(summary.avg_adr)} delta={deltaVsP50 ? { value: deltaVsP50.adr } : null} hint={`p50 ${Math.round(bench.adr.p50)}`} />
                <KPITile label="HS%" value={`${Math.round(summary.avg_hs_pct)}%`} hint={`p50 ${Math.round(bench.hs_pct.p50)}%`} />
              </StaggerGrid>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl">Tendencia (últimos {trend.length})</h2>
                    <Badge variant="neutral">ACS & KAST</Badge>
                  </div>
                  {trend.length === 0 ? (
                    <div className="py-8 text-center text-text-secondary text-sm">Sin partidas suficientes.</div>
                  ) : (
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend}>
                          <CartesianGrid {...chartGridProps} />
                          <XAxis dataKey="map_name" {...chartAxisProps} hide />
                          <YAxis yAxisId="l" {...chartAxisProps} />
                          <YAxis yAxisId="r" orientation="right" {...chartAxisProps} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line yAxisId="l" type="monotone" dataKey="acs" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
                          <Line yAxisId="r" type="monotone" dataKey="kast" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display text-xl flex items-center gap-2">
                        <Brain size={18} className="text-accent" />
                        Weakness Report
                      </h2>
                      <p className="text-xs text-text-secondary mt-1">Análisis IA sobre oportunidades de mejora.</p>
                    </div>
                    <button
                      onClick={runWeaknessReport}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 disabled:opacity-60 transition-colors"
                    >
                      <Sparkles size={14} /> {aiLoading ? 'Analizando…' : 'Generar'}
                    </button>
                  </div>
                  {!weakness ? (
                    <div className="text-sm text-text-secondary py-4">Corre el análisis para ver fortalezas, debilidades y drills.</div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-accent mb-1">Role-fit score</div>
                        <div className="font-display text-3xl">{weakness.role_fit_score}<span className="text-text-secondary">/100</span></div>
                      </div>
                      <Section title="Debilidades" items={weakness.top_weaknesses} />
                      <Section title="Fortalezas" items={weakness.top_strengths} />
                      <Section title="Drills recomendados" items={weakness.recommended_drills} />
                    </div>
                  )}
                </section>
              </div>

              {death && (
                <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl">Death-order (round-level)</h2>
                    <Badge variant={death.total_rounds > 0 ? 'accent' : 'neutral'}>
                      {death.total_rounds} rondas
                    </Badge>
                  </div>
                  {death.total_rounds === 0 ? (
                    <div className="text-sm text-text-secondary py-4">
                      Métrica round-level sin datos. Requiere sincronización con la API de Riot (RoundEvent).
                      Se activa automáticamente cuando haya partidas con <code className="font-mono text-xs bg-bg-elevated px-1 rounded">data_source=api</code>.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <KPITile label="First Death Rate" value={`${death.first_death_rate.toFixed(1)}%`} hint={`${death.fd_count} rondas`} accent="accent" />
                      <KPITile label="First Blood Rate" value={`${death.first_blood_rate.toFixed(1)}%`} hint={`${death.fb_count} rondas`} accent="success" />
                      <KPITile label="Survival Rate" value={`${death.survival_rate.toFixed(1)}%`} />
                      <KPITile label="Total rondas" value={death.total_rounds} />
                    </div>
                  )}
                </section>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SplitTable
                  title="Por agente"
                  headers={['Agente', 'G', 'WR', 'ACS', 'K/D']}
                  rows={byAgent.map((r) => ({
                    key: r.agent,
                    left: <div className="flex items-center gap-2"><AgentPortrait agent={r.agent} size={28} /><span>{r.agent}</span></div>,
                    values: [r.games, `${r.winrate}%`, Math.round(r.avg_acs), r.kd.toFixed(2)],
                  }))}
                />
                <SplitTable
                  title="Por mapa"
                  headers={['Mapa', 'G', 'WR', 'ACS', 'K/D']}
                  rows={byMap.map((r) => ({
                    key: r.map_name,
                    left: <div className="flex items-center gap-2"><MapThumbnail mapName={r.map_name} className="w-10 h-7" /><span>{r.map_name}</span></div>,
                    values: [r.games, `${r.winrate}%`, Math.round(r.avg_acs), r.kd.toFixed(2)],
                  }))}
                />
              </div>
            </>
          )}
        </DataBoundary>
      </div>
    </FadePage>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{title}</div>
      <ul className="space-y-1 list-disc list-inside text-text-primary">
        {items.map((x, i) => <li key={i} className="text-sm">{x}</li>)}
      </ul>
    </div>
  );
}

interface SplitRow { key: string; left: ReactNode; values: (string | number)[]; }
function SplitTable({ title, rows, headers }: { title: string; rows: SplitRow[]; headers: string[] }) {
  return (
    <section className="bg-bg-surface border border-border-default rounded-xl p-6">
      <h2 className="font-display text-xl mb-4">{title}</h2>
      {rows.length === 0 ? (
        <div className="py-4 text-center text-text-secondary text-sm">Sin datos.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-text-secondary border-b border-border-default">
                {headers.map((h) => <th key={h} className="text-left py-2 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.key} className="border-b border-border-default/40 last:border-0">
                  <td className="py-2">{r.left}</td>
                  {r.values.map((v, i) => <td key={i} className="py-2 font-mono text-text-secondary">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
