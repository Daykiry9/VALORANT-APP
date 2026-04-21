import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, FileUp, Search, Swords, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { ResultPill } from '../components/ui/ResultPill';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { Badge } from '../components/ui/Badge';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import type { Match, OcrScoreboard, Tier } from '../lib/types';

const TIERS: Tier[] = ['T1', 'T2', 'T3', 'T4'];

interface Draft {
  map_name: string;
  our_score: number;
  rival_score: number;
  opponent_name: string;
  opponent_tier: string;
  vod_link: string;
  players: DraftPlayer[];
}

interface DraftPlayer {
  display_name: string;
  agent: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  first_bloods: number;
  first_deaths: number;
  hs_pct: number;
  kast_pct: number;
  adr: number;
  plants: number;
  defuses: number;
}

function ocrToDraft(ocr: OcrScoreboard): Draft {
  return {
    map_name: ocr.map_name || '',
    our_score: ocr.our_score ?? 0,
    rival_score: ocr.rival_score ?? 0,
    opponent_name: '',
    opponent_tier: '',
    vod_link: '',
    players: (ocr.scoreboard || []).slice(0, 5).map((p) => ({
      display_name: p.name || '',
      agent: p.agent || '',
      acs: p.acs ?? 0,
      kills: p.kills ?? 0,
      deaths: p.deaths ?? 0,
      assists: p.assists ?? 0,
      first_bloods: p.first_bloods ?? 0,
      first_deaths: 0,
      hs_pct: 0,
      kast_pct: 0,
      adr: 0,
      plants: p.plants ?? 0,
      defuses: p.defuses ?? 0,
    })),
  };
}

export function ScrimTracker() {
  const { currentTeamId } = useTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setMatches(await api.getScrims(200));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const mf = mapFilter.toLowerCase();
    const of = opponentFilter.toLowerCase();
    return matches.filter((m) =>
      (!mf || (m.map_name || '').toLowerCase().includes(mf)) &&
      (!of || (m.opponent_name || '').toLowerCase().includes(of)) &&
      (!resultFilter || m.result === resultFilter)
    );
  }, [matches, mapFilter, resultFilter, opponentFilter]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const r = await api.uploadScoreboard(file);
      if (r.success && r.data) {
        setDraft(ocrToDraft(r.data as OcrScoreboard));
        toast.success('Scoreboard extraído. Revisa antes de guardar.');
      } else {
        toast.error(r.error || 'OCR falló');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload falló');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function commitDraft() {
    if (!draft || !currentTeamId) return;
    const result = draft.our_score > draft.rival_score ? 'W' : draft.our_score < draft.rival_score ? 'L' : 'D';
    setSubmitting(true);
    try {
      await api.createScrim({
        team_id: currentTeamId,
        match_date: new Date().toISOString(),
        opponent_name: draft.opponent_name || 'Desconocido',
        opponent_tier: draft.opponent_tier || null,
        map_name: draft.map_name || 'Unknown',
        result,
        team_rounds_won: draft.our_score,
        team_rounds_lost: draft.rival_score,
        defense_rounds_won: 0,
        attack_rounds_won: 0,
        composition: JSON.stringify(draft.players.map((p) => p.agent).filter(Boolean)),
        vod_link: draft.vod_link || null,
        players_data: draft.players,
      });
      toast.success('Scrim guardado');
      setDraft(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando scrim');
    } finally { setSubmitting(false); }
  }

  function updatePlayer(idx: number, field: keyof DraftPlayer, value: string | number) {
    if (!draft) return;
    const players = [...draft.players];
    players[idx] = { ...players[idx], [field]: value };
    setDraft({ ...draft, players });
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Scrim Tracker</div>
            <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
              <Swords size={28} className="text-accent" /> Historial de Scrims
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
            >
              <FileUp size={16} /> {uploading ? 'Procesando…' : 'Upload Scoreboard'}
            </button>
          </div>
        </header>

        {draft && (
          <section className="bg-bg-surface border border-accent/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-display text-xl">Revisar scrim antes de guardar</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-default text-xs hover:border-accent hover:text-accent"
                >
                  <Trash2 size={12} /> Descartar
                </button>
                <button
                  onClick={commitDraft}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs hover:bg-accent/90 disabled:opacity-60"
                >
                  <CheckCircle2 size={12} /> {submitting ? 'Guardando…' : 'Guardar scrim'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Field label="Mapa">
                <input value={draft.map_name} onChange={(e) => setDraft({ ...draft, map_name: e.target.value })}
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm" />
              </Field>
              <Field label="Rival">
                <input value={draft.opponent_name} onChange={(e) => setDraft({ ...draft, opponent_name: e.target.value })}
                  placeholder="Nombre del rival"
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm" />
              </Field>
              <Field label="Tier">
                <select value={draft.opponent_tier} onChange={(e) => setDraft({ ...draft, opponent_tier: e.target.value })}
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm">
                  <option value="">—</option>
                  {TIERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Nuestro score">
                <input type="number" value={draft.our_score} onChange={(e) => setDraft({ ...draft, our_score: Number(e.target.value) })}
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm font-mono" />
              </Field>
              <Field label="Rival score">
                <input type="number" value={draft.rival_score} onChange={(e) => setDraft({ ...draft, rival_score: Number(e.target.value) })}
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm font-mono" />
              </Field>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-text-secondary border-b border-border-default">
                    <th className="text-left py-2 px-2 font-normal">Jugador</th>
                    <th className="text-left py-2 px-2 font-normal">Agente</th>
                    <th className="text-left py-2 px-2 font-normal">ACS</th>
                    <th className="text-left py-2 px-2 font-normal">K</th>
                    <th className="text-left py-2 px-2 font-normal">D</th>
                    <th className="text-left py-2 px-2 font-normal">A</th>
                    <th className="text-left py-2 px-2 font-normal">FB</th>
                    <th className="text-left py-2 px-2 font-normal">FD</th>
                    <th className="text-left py-2 px-2 font-normal">KAST%</th>
                    <th className="text-left py-2 px-2 font-normal">ADR</th>
                    <th className="text-left py-2 px-2 font-normal">HS%</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.players.map((p, i) => (
                    <tr key={i} className="border-b border-border-default/30">
                      <td className="py-1.5 px-1"><EditCell value={p.display_name} onChange={(v) => updatePlayer(i, 'display_name', String(v))} type="text" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.agent} onChange={(v) => updatePlayer(i, 'agent', String(v))} type="text" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.acs} onChange={(v) => updatePlayer(i, 'acs', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.kills} onChange={(v) => updatePlayer(i, 'kills', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.deaths} onChange={(v) => updatePlayer(i, 'deaths', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.assists} onChange={(v) => updatePlayer(i, 'assists', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.first_bloods} onChange={(v) => updatePlayer(i, 'first_bloods', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.first_deaths} onChange={(v) => updatePlayer(i, 'first_deaths', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.kast_pct} onChange={(v) => updatePlayer(i, 'kast_pct', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.adr} onChange={(v) => updatePlayer(i, 'adr', Number(v))} type="number" /></td>
                      <td className="py-1.5 px-1"><EditCell value={p.hs_pct} onChange={(v) => updatePlayer(i, 'hs_pct', Number(v))} type="number" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input placeholder="Mapa" value={mapFilter} onChange={(e) => setMapFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm w-40" />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input placeholder="Rival" value={opponentFilter} onChange={(e) => setOpponentFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm w-48" />
          </div>
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm">
            <option value="">Todos</option>
            <option value="W">Victorias</option>
            <option value="L">Derrotas</option>
            <option value="D">Empates</option>
          </select>
          <span className="text-xs font-mono text-text-secondary">{filtered.length} / {matches.length}</span>
        </div>

        <DataBoundary loading={loading} error={error} empty={!loading && matches.length === 0} emptyMessage="Sin scrims todavía. Sube tu primer scoreboard.">
          <div className="overflow-x-auto bg-bg-surface border border-border-default rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-wider text-text-secondary border-b border-border-default">
                  <th className="text-left px-4 py-3 font-normal">Fecha</th>
                  <th className="text-left px-4 py-3 font-normal">Mapa</th>
                  <th className="text-left px-4 py-3 font-normal">Rival</th>
                  <th className="text-left px-4 py-3 font-normal">Tier</th>
                  <th className="text-left px-4 py-3 font-normal">Resultado</th>
                  <th className="text-left px-4 py-3 font-normal">Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border-default/40 hover:bg-bg-elevated transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapThumbnail mapName={m.map_name} className="w-10 h-7" />
                        <span>{m.map_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{m.opponent_name || '—'}</td>
                    <td className="px-4 py-3">{m.opponent_tier && <Badge variant="neutral">{m.opponent_tier}</Badge>}</td>
                    <td className="px-4 py-3"><ResultPill result={m.result} score={`${m.team_rounds_won ?? '?'}-${m.team_rounds_lost ?? '?'}`} /></td>
                    <td className="px-4 py-3"><Badge variant="neutral">{m.data_source || '—'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/app/matches/${m.id}`} className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent">
                        Ver <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataBoundary>
      </div>
    </FadePage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      {children}
    </div>
  );
}

function EditCell({ value, onChange, type }: { value: string | number; onChange: (v: string | number) => void; type: 'text' | 'number' }) {
  return (
    <input
      type={type}
      value={value as number | string}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full bg-transparent border border-transparent hover:border-border-default focus:border-accent rounded px-1.5 py-0.5 text-xs font-mono"
    />
  );
}
