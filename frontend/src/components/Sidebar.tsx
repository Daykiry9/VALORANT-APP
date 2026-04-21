import { LayoutDashboard, Users, Shield, FileText, Settings, Target, LogOut, UserPlus, ChevronDown, Crosshair } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useTeam } from '../context/TeamContext';
import { Badge } from './ui/Badge';

const TABS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/scrims', label: 'Scrim Tracker', icon: FileText },
  { to: '/app/team', label: 'Team Analysis', icon: Shield },
  { to: '/app/players', label: 'Player Stats', icon: Users },
  { to: '/app/scouting', label: 'Scouting', icon: Crosshair },
  { to: '/app/tryouts', label: 'Tryouts', icon: UserPlus },
  { to: '/app/roster', label: 'Roster', icon: Users },
];

export function Sidebar() {
  const { teams, currentTeam, setCurrentTeamId } = useTeam();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <aside className="w-[240px] h-screen bg-bg-surface border-r border-border-default flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 gap-2 border-b border-border-default">
        <div className="w-7 h-7 flex items-center justify-center bg-accent rounded">
          <Target size={14} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-text-primary">
          VAL<span className="font-light text-text-secondary">OPS</span>
        </span>
      </div>

      {teams.length > 0 && (
        <div className="px-4 pt-4">
          <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-2">Team</div>
          <div className="relative">
            <select
              value={currentTeam?.id ?? ''}
              onChange={(e) => setCurrentTeamId(e.target.value)}
              className="w-full appearance-none bg-bg-elevated border border-border-default rounded-lg px-3 py-2 pr-8 text-sm text-text-primary font-mono cursor-pointer hover:border-border-active transition-colors"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tag ? `[${t.tag}] ` : ''}{t.name || 'Team'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          {currentTeam?.plan && (
            <div className="mt-2 flex items-center gap-1.5">
              <Badge variant="accent">{currentTeam.plan}</Badge>
              {currentTeam.region && <Badge variant="neutral">{currentTeam.region}</Badge>}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 pt-4">
        <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-2 px-2">
          Main Intel
        </div>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {isActive && <div className="ml-auto w-1 h-4 bg-accent rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border-default space-y-1">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            )
          }
        >
          <Settings size={18} />
          <span>Configuración</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent/5 transition-all"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
