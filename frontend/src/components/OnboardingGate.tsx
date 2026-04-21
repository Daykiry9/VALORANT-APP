import { useState } from 'react';
import toast from 'react-hot-toast';
import { Rocket, Target } from 'lucide-react';

import { useTeam } from '../context/TeamContext';
import { api } from '../lib/api';

const REGIONS = [
  { code: 'la1', name: 'LATAM North' },
  { code: 'la2', name: 'LATAM South' },
  { code: 'na', name: 'NA' },
  { code: 'br', name: 'Brazil' },
  { code: 'eu', name: 'EMEA' },
  { code: 'ap', name: 'APAC' },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { currentTeamId, loading, reload } = useTeam();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [region, setRegion] = useState('la1');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (currentTeamId) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) {
      toast.error('Nombre y tag son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await api.createTeam({ name: name.trim(), tag: tag.trim().toUpperCase(), region });
      toast.success(`Team ${name} creado`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error creando equipo');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen w-full bg-bg-base text-text-primary flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl p-8 space-y-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-accent rounded-lg">
            <Target size={20} color="#fff" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Bienvenido</div>
            <h1 className="font-display text-3xl font-bold">Crea tu equipo</h1>
          </div>
        </div>

        <p className="text-sm text-text-secondary">
          Necesitamos un equipo para empezar. Podrás invitar coaches, registrar jugadores
          titulares y tryouts, y subir tu primer scrim después.
        </p>

        <div className="space-y-3">
          <Field label="Nombre del equipo">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sentinel Esports"
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm"
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tag">
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="SEN"
                className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm font-mono"
                required
              />
            </Field>
            <Field label="Región">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm"
              >
                {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-60 transition-colors"
        >
          <Rocket size={16} /> {submitting ? 'Creando…' : 'Crear equipo y continuar'}
        </button>

        <p className="text-xs text-text-secondary text-center">
          Plan inicial: <span className="font-mono text-accent">free</span>. Upgrade desde Settings cuando quieras.
        </p>
      </form>
    </div>
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
