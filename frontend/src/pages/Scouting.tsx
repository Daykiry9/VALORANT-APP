import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Crosshair, Shield, Sparkles, Target } from 'lucide-react';
import toast from 'react-hot-toast';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { Badge, tierVariant } from '../components/ui/Badge';
import { ResultPill } from '../components/ui/ResultPill';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import type { OpponentListRow, ScoutingAIReport, ScoutingPayload } from '../lib/types';

const THREAT_STYLE = {
  low: { color: 'bg-success/10 text-success border-success/40', label: 'Bajo' },
  medium: { color: 'bg-accent-orange/10 text-accent-orange border-accent-orange/40', label: 'Medio' },
  high: { color: 'bg-accent/10 text-accent border-accent/40', label: 'Alto' },
  elite: { color: 'bg-accent/20 text-accent border-accent/60', label: 'Elite' },
} as const;

export function Scouting() {
  const { opponent } = useParams();
  const decoded = opponent ? decodeURIComponent(opponent) : undefined;
  const navigate = useNavigate();
  const { currentTeamId } = useTeam();

  const [opponents, setOpponents] = useState<OpponentListRow[]>([]);
  const [report, setReport] = useState<ScoutingPayload | null>(null);
  const [ai, setAi] = useState<ScoutingAIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeamId) return;
    api.getOpponents(currentTeamId).then(setOpponents).catch((e: Error) => setError(e.message));
  }, [currentTeamId]);

  useEffect(() => {
    if (!currentTeamId || !decoded) { setReport(null); setAi(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getScoutingPayload(currentTeamId, decoded)
      .then((r) => { if (!cancelled) { setReport(r); setAi(null); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentTeamId, decoded]);

  async function runAiReport() {
    if (!currentTeamId || !decoded) return;
    setAiLoading(true);
    try {
      setAi(await api.getScoutingAIReport(currentTeamId, decoded));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI falló');
    } finally { setAiLoading(false); }
  }

  const threat = useMemo(() => ai ? THREAT_STYLE[ai.threat_level] : null, [ai]);

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Scouting</div>
          <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
            <Crosshair size={28} className="text-accent" />
            {decoded || 'Rivales'}
          </h1>
        </header>

        {!decoded && (
          <DataBoundary loading={false} error={error} empty={opponents.length === 0} emptyMessage="Aún no has enfrentado rivales.">
            <section className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-text-secondary border-b border-border-default">
                    <th className="text-left px-4 py-3 font-normal">Rival</th>
                    <th className="text-left px-4 py-3 font-normal">Tier</th>
                    <th className="text-left px-4 py-3 font-normal">Partidas</th>
                    <th className="text-left px-4 py-3 font-normal">WR vs nosotros</th>
                    <th className="text-left px-4 py-3 font-normal">Última</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {opponents.map((o) => (
                    <tr key={o.name} className="border-b border-border-default/40 hover:bg-bg-elevated transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/scouting/${encodeURIComponent(o.name)}`)}>
                      <td className="px-4 py-3 font-medium">{o.name}</td>
                      <td className="px-4 py-3">{o.tier && <Badge variant={tierVariant(o.tier)}>{o.tier}</Badge>}</td>
                      <td className="px-4 py-3 font-mono">{o.games}</td>
                      <td className={`px-4 py-3 font-mono ${o.winrate >= 50 ? 'text-success' : 'text-accent'}`}>{o.winrate}%</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {o.last_faced ? new Date(o.last_faced).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Target size={14} className="inline text-text-secondary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </DataBoundary>
        )}

        {decoded && (
          <DataBoundary loading={loading} error={error} empty={!report} emptyMessage="Sin historial vs este rival.">
            {report && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {report.tier && <Badge variant={tierVariant(report.tier)}>{report.tier}</Badge>}
                    <ResultPill result={report.winrate >= 50 ? 'W' : 'L'} score={`${report.wins}-${report.losses}`} />
                    <span className="text-sm text-text-secondary">{report.total_games} partidas · Δ {report.avg_round_diff}</span>
                    {threat && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-mono text-xs ${threat.color}`}>
                        <AlertTriangle size={12} /> Threat: {threat.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={runAiReport}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
                  >
                    <Sparkles size={14} /> {aiLoading ? 'Analizando…' : ai ? 'Regenerar briefing' : 'Generar briefing IA'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                    <h2 className="font-display text-xl mb-4">Performance por mapa</h2>
                    {report.by_map.length === 0 ? (
                      <div className="py-4 text-center text-text-secondary text-sm">Sin datos de mapa.</div>
                    ) : (
                      <div className="space-y-2">
                        {report.by_map.map((m) => (
                          <div key={m.map_name} className="flex items-center gap-3 p-2 rounded border border-border-default bg-bg-elevated">
                            <MapThumbnail mapName={m.map_name} className="w-12 h-8" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{m.map_name}</div>
                              <div className="text-[10px] font-mono text-text-secondary">
                                {m.games}G · {m.wins}W · Δ {m.avg_round_diff}
                              </div>
                            </div>
                            <div className={`font-mono text-sm ${m.winrate >= 50 ? 'text-success' : 'text-accent'}`}>
                              {m.winrate}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="bg-bg-surface border border-border-default rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-xl">Pistol pattern</h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <PistolTile label="DEF pistol ganado" value={report.pistol_pattern.def_won} tone="success" />
                      <PistolTile label="DEF pistol perdido" value={report.pistol_pattern.def_lost} tone="accent" />
                      <PistolTile label="ATK pistol ganado" value={report.pistol_pattern.att_won} tone="success" />
                      <PistolTile label="ATK pistol perdido" value={report.pistol_pattern.att_lost} tone="accent" />
                    </div>

                    <h3 className="font-display text-lg mt-4 flex items-center gap-2">
                      <Shield size={16} className="text-accent" /> Últimas partidas
                    </h3>
                    <div className="space-y-1.5">
                      {report.recent_matches.slice(0, 5).map((m) => (
                        <div key={m.match_id} className="flex items-center gap-2 text-xs">
                          <ResultPill result={m.result} />
                          <span className="font-mono text-text-secondary w-24 truncate">{m.map_name || '—'}</span>
                          <span className="font-mono">{m.score}</span>
                          <span className="font-mono text-text-secondary text-[10px] ml-auto">
                            {m.date ? new Date(m.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {ai && (
                  <section className="bg-bg-surface border border-accent/40 rounded-xl p-6">
                    <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                      <Sparkles size={20} className="text-accent" /> Pre-match briefing
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                      <AiBlock title="Estilo esperado" body={ai.expected_playstyle} />
                      <AiBlock title="Pistol read" body={ai.pistol_read} />
                      <AiBlock title="Confianza" body={`${Math.round(ai.confidence * 100)}% (basado en sample size)`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <ChipList title="Prioridad de picks" items={ai.map_priority} tone="success" />
                      <ChipList title="Mapas a banear" items={ai.map_to_ban} tone="accent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Debilidades detectadas</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {ai.detected_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Gameplan</div>
                        <ol className="list-decimal list-inside space-y-0.5">
                          {ai.gameplan.map((g, i) => <li key={i}>{g}</li>)}
                        </ol>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </DataBoundary>
        )}
      </div>
    </FadePage>
  );
}

function PistolTile({ label, value, tone }: { label: string; value: number; tone: 'success' | 'accent' }) {
  return (
    <div className={`p-3 rounded-lg border bg-bg-elevated ${tone === 'success' ? 'border-success/30' : 'border-accent/30'}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">{label}</div>
      <div className={`font-display text-2xl ${tone === 'success' ? 'text-success' : 'text-accent'}`}>{value}</div>
    </div>
  );
}

function AiBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-3 rounded-lg border border-border-default bg-bg-elevated">
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{title}</div>
      <p className="text-sm">{body}</p>
    </div>
  );
}

function ChipList({ title, items, tone }: { title: string; items: string[]; tone: 'success' | 'accent' }) {
  const cls = tone === 'success' ? 'bg-success/10 text-success border-success/40' : 'bg-accent/10 text-accent border-accent/40';
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-text-secondary">—</span>
        ) : (
          items.map((x, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-md border font-mono text-xs ${cls}`}>{x}</span>
          ))
        )}
      </div>
    </div>
  );
}
