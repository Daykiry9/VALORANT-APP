import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Settings,
  Target,
  LogOut,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scrim-tracker', label: 'Scrim Tracker', icon: FileText },
  { id: 'team-analysis', label: 'Team Analysis', icon: Shield },
  { id: 'player-performance', label: 'Player Stats', icon: Users },
  { id: 'tryouts', label: 'Tryouts', icon: UserPlus },
  { id: 'roster', label: 'Roster', icon: Users },
];

export function Sidebar({ currentTab, setCurrentTab }: { currentTab: string, setCurrentTab: (tab: string) => void }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="w-[240px] h-screen bg-bg-surface border-r border-border-default flex flex-col shrink-0">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 gap-2 mb-4">
        <div className="w-7 h-7 flex items-center justify-center bg-accent rounded">
          <Target size={14} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="font-rajdhani font-bold text-xl tracking-tight text-text-primary">
          VAL<span className="font-light text-text-secondary">OPS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-4 px-2">Main Intel</div>
        {TABS.map(tab => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                active 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {active && <div className="ml-auto w-1 h-4 bg-accent rounded-full" />}
            </button>
          )
        })}
      </nav>

      {/* Footer / User Section */}
      <div className="p-4 mt-auto border-t border-border-default space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
          <Settings size={18} />
          <span>Configuración</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent/5 transition-all"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
