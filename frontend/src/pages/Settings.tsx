import { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { FadePage } from '../components/motion/FadePage';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { currentTeam, teams, setCurrentTeamId } = useTeam();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'));

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') {
      if (next === 'light') document.documentElement.dataset.theme = 'light';
      else delete document.documentElement.dataset.theme;
    }
  }

  return (
    <FadePage>
      <div className="p-8 max-w-[900px] mx-auto space-y-6">
        <header>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Settings</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Configuración</h1>
        </header>

        <section className="bg-bg-surface border border-border-default rounded-xl p-6 space-y-3">
          <h2 className="font-display text-xl">Equipo activo</h2>
          {!currentTeam ? (
            <p className="text-sm text-text-secondary">Sin equipo seleccionado.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="font-display text-2xl">{currentTeam.name}</div>
                {currentTeam.tag && <Badge variant="accent">{currentTeam.tag}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{currentTeam.region || '—'}</Badge>
                <Badge variant="warning">{currentTeam.plan}</Badge>
              </div>
              {teams.length > 1 && (
                <div className="pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">Cambiar equipo</div>
                  <select
                    value={currentTeam.id}
                    onChange={(e) => setCurrentTeamId(e.target.value)}
                    className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-sm"
                  >
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-bg-surface border border-border-default rounded-xl p-6">
          <h2 className="font-display text-xl mb-3">Apariencia</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Tema</div>
              <div className="text-xs text-text-secondary">Actual: {theme}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg border border-border-default text-sm hover:border-accent hover:text-accent transition-colors"
            >
              Cambiar a {theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </section>

        <section className="bg-bg-surface border border-border-default rounded-xl p-6">
          <h2 className="font-display text-xl mb-3">Cuenta</h2>
          <button
            onClick={() => supabase.auth.signOut().then(() => (window.location.href = '/'))}
            className="px-4 py-2 rounded-lg border border-accent text-accent text-sm hover:bg-accent/10 transition-colors"
          >
            Cerrar sesión
          </button>
        </section>
      </div>
    </FadePage>
  );
}
