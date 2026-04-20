import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileUp, Search, Swords } from 'lucide-react';
import toast from 'react-hot-toast';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { ResultPill } from '../components/ui/ResultPill';
import { MapThumbnail } from '../components/ui/MapThumbnail';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import type { Match } from '../lib/types';

export function ScrimTracker() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [opponentFilter, setOpponentFilter] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<unknown | null>(null);

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
      if (r.success) {
        setOcrPreview(r.data);
        toast.success('Scoreboard extraído. Revisa y confirma.');
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

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              placeholder="Mapa"
              value={mapFilter}
              onChange={(e) => setMapFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm w-40"
            />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              placeholder="Rival"
              value={opponentFilter}
              onChange={(e) => setOpponentFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm w-48"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm"
          >
            <option value="">Todos</option>
            <option value="W">Victorias</option>
            <option value="L">Derrotas</option>
            <option value="D">Empates</option>
          </select>
          <span className="text-xs font-mono text-text-secondary">{filtered.length} / {matches.length}</span>
        </div>

        {ocrPreview !== null && (
          <div className="bg-bg-surface border border-accent/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg">OCR preview</h3>
              <button onClick={() => setOcrPreview(null)} className="text-xs text-text-secondary hover:text-accent">Descartar</button>
            </div>
            <pre className="text-[11px] font-mono text-text-secondary overflow-x-auto max-h-64">
              {JSON.stringify(ocrPreview, null, 2)}
            </pre>
            <p className="mt-2 text-xs text-text-secondary">Confirma visualmente y crea el scrim con POST /api/scrims/.</p>
          </div>
        )}

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
                  <th className="text-left px-4 py-3 font-normal"></th>
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
