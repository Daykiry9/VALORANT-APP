import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

import { FadePage } from '../components/motion/FadePage';
import { DataBoundary } from '../components/ui/DataBoundary';
import { Badge, roleVariant } from '../components/ui/Badge';
import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';
import type { Player } from '../lib/types';

type Tab = 'main' | 'tryouts';

export function Roster() {
  const { currentTeamId } = useTeam();
  const [tab, setTab] = useState<Tab>('main');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    if (!currentTeamId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.getPlayers({ team_id: currentTeamId, is_tryout: tab === 'tryouts' ? 'true' : 'false' });
      setPlayers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando roster');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [currentTeamId, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function togglePlayer(p: Player) {
    try {
      if (p.is_tryout) {
        await api.promotePlayer(p.id);
        toast.success(`${p.display_name} promovido a main roster`);
      } else {
        await api.demotePlayer(p.id);
        toast.success(`${p.display_name} movido a tryouts`);
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Acción falló');
    }
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Roster</div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Jugadores</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
          >
            <Plus size={16} /> Agregar jugador
          </button>
        </header>

        <div className="flex gap-2 border-b border-border-default">
          {(['main', 'tryouts'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'main' ? 'Main Roster' : 'Tryouts'}
            </button>
          ))}
        </div>

        <DataBoundary loading={loading} error={error} empty={!loading && players.length === 0} emptyMessage={tab === 'main' ? 'Sin roster titular aún.' : 'Sin candidatos tryout.'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => (
              <div key={p.id} className="bg-bg-surface border border-border-default rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-display text-xl">{p.display_name}</div>
                    <div className="text-xs text-text-secondary">{p.riot_id || 'Sin Riot ID'}</div>
                  </div>
                  <Badge variant={roleVariant(p.role)}>{p.role || 'flex'}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={p.is_tryout ? 'status-tryout' : 'status-main'}>
                    {p.is_tryout ? 'Tryout' : 'Main'}
                  </Badge>
                  {p.rso_linked && <Badge variant="success">RSO</Badge>}
                  {!p.active && <Badge variant="neutral">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/app/players/${p.id}`}
                    className="flex-1 text-center px-3 py-1.5 rounded-lg border border-border-default text-xs hover:border-border-active transition-colors"
                  >
                    Ver stats
                  </Link>
                  <button
                    onClick={() => togglePlayer(p)}
                    className="px-3 py-1.5 rounded-lg border border-border-default text-xs hover:border-accent hover:text-accent transition-colors inline-flex items-center gap-1"
                    title={p.is_tryout ? 'Promote to main' : 'Move to tryouts'}
                  >
                    {p.is_tryout ? <UserCheck size={12} /> : <UserX size={12} />}
                    {p.is_tryout ? 'Promote' : 'Demote'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DataBoundary>
      </div>

      {showAdd && <AddPlayerModal onClose={() => setShowAdd(false)} onCreated={load} defaultTryout={tab === 'tryouts'} />}
    </FadePage>
  );
}

function AddPlayerModal({ onClose, onCreated, defaultTryout }: { onClose: () => void; onCreated: () => void; defaultTryout: boolean }) {
  const [name, setName] = useState('');
  const [riotId, setRiotId] = useState('');
  const [role, setRole] = useState('flex');
  const [isTryout, setIsTryout] = useState(defaultTryout);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPlayer({ display_name: name, riot_id: riotId, role, is_tryout: isTryout });
      toast.success('Jugador creado');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando jugador');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="font-display text-2xl">Nuevo jugador</h2>
        <FormField label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm" />
        </FormField>
        <FormField label="Riot ID">
          <input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Name#Tag" className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm" />
        </FormField>
        <FormField label="Rol">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm">
            {['duelist', 'initiator', 'controller', 'sentinel', 'flex'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isTryout} onChange={(e) => setIsTryout(e.target.checked)} />
          Tryout
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border-default">Cancelar</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-accent text-white disabled:opacity-60">{submitting ? '…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      {children}
    </div>
  );
}
