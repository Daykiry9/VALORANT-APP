import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { Badge } from '../components/ui/Badge';
import { ResultPill } from '../components/ui/ResultPill';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { api } from '../lib/api';
import type { Match, MatchInsight } from '../lib/types';

export function MatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [insight, setInsight] = useState<MatchInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getScrims(500)
      .then((all) => {
        if (cancelled) return;
        setMatch(all.find((m) => m.id === matchId) || null);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    api.getMatchInsight(matchId).then(setInsight).catch(() => {});
    return () => { cancelled = true; };
  }, [matchId]);

  async function generateInsight() {
    if (!matchId) return;
    setAiLoading(true);
    try {
      const r = await api.generateMatchInsight(matchId);
      setInsight(r);
      toast.success('Tactical briefing generado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'IA falló');
    } finally { setAiLoading(false); }
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent">
          <ArrowLeft size={14} /> Volver
        </button>

        <DataBoundary loading={loading} error={error} empty={!match} emptyMessage="Partida no encontrada.">
          {match && (
            <>
              <header className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <MapThumbnail mapName={match.map_name} className="w-24 h-16" variant="splash" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Match Report</div>
                    <h1 className="font-display text-3xl font-bold">
                      {match.map_name || '—'} <span className="text-text-secondary">vs</span> {match.opponent_name || '—'}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <ResultPill result={match.result} score={`${match.team_rounds_won ?? '?'} - ${match.team_rounds_lost ?? '?'}`} />
                      {match.opponent_tier && <Badge variant="neutral">{match.opponent_tier}</Badge>}
                      {match.data_source && <Badge variant="accent">{match.data_source}</Badge>}
                      {match.date && <span className="text-xs text-text-secondary">{new Date(match.date).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generateInsight}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 disabled:opacity-60"
                  >
                    <Sparkles size={14} /> {aiLoading ? 'Generando…' : 'Tactical briefing'}
                  </button>
                  <button
                    onClick={() => api.exportMatchPDF(match.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-sm hover:border-accent hover:text-accent transition-colors"
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
              </header>

              <section className="bg-bg-surface border border-border-default rounded-xl p-6">
                <h2 className="font-display text-xl mb-3 flex items-center gap-2"><Sparkles size={18} className="text-accent" /> Tactical Briefing</h2>
                {!insight ? (
                  <p className="text-sm text-text-secondary">No hay briefing todavía. Genera uno con el botón arriba.</p>
                ) : (
                  <div className="space-y-4 text-sm">
                    <InsightBlock title="Problema principal" body={insight.content.main_problem} tone="accent" />
                    <InsightBlock title="Jugador destacado" body={insight.content.standout_player} tone="success" />
                    <InsightBlock title="Acción para el próximo scrim" body={insight.content.next_action} tone="warning" />
                    {insight.content.composition_read && <InsightBlock title="Composición" body={insight.content.composition_read} />}
                    {insight.content.eco_read && <InsightBlock title="Economía" body={insight.content.eco_read} />}
                    {insight.content.weaknesses_detected.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Debilidades detectadas</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {insight.content.weaknesses_detected.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-text-secondary">
                      v{insight.version} · {insight.model} · confianza {Math.round(insight.content.confidence * 100)}%
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </DataBoundary>
      </div>
    </FadePage>
  );
}

function InsightBlock({ title, body, tone }: { title: string; body: string; tone?: 'accent' | 'success' | 'warning' }) {
  const toneCls = tone === 'accent' ? 'border-accent/40 bg-accent/5' : tone === 'success' ? 'border-success/40 bg-success/5' : tone === 'warning' ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-border-default bg-bg-elevated';
  return (
    <div className={`p-3 rounded-lg border ${toneCls}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{title}</div>
      <p>{body}</p>
    </div>
  );
}
