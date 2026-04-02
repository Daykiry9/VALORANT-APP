import React from 'react';
import { LayoutDashboard, Users, Shield, FileText, Search, Activity, Globe, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'player-performance', label: 'Jugadores', icon: Users },
  { id: 'team', label: 'Equipo', icon: Shield },
  { id: 'scrim-tracker', label: 'Scrim Tracker', icon: FileText },
  { id: 'analysis', label: 'Análisis de Partida', icon: Search },
  { id: 'tryouts', label: 'Tryouts', icon: Activity },
  { id: 'rivals', label: 'Rivales', icon: Globe },
  { id: 'roster', label: 'Roster', icon: UserPlus },
];

export function Sidebar({ currentTab, setCurrentTab }: { currentTab: string, setCurrentTab: (tab: string) => void }) {
  return (
    <div className="w-[72px] hover:w-[240px] transition-all duration-300 absolute left-0 top-0 h-full bg-bg-surface border-r border-border-default z-50 flex flex-col pt-6 pb-6 shadow-2xl group">
      <div className="flex items-center justify-center h-16 w-full relative mb-6">
        <div className="text-accent font-display text-2xl font-bold tracking-widest relative custom-glitch">
          VAL
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {TABS.map(tab => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={cn(
                "w-full flex items-center h-12 rounded-sm transition-all duration-200 relative group/btn overflow-hidden",
                active ? "text-white bg-bg-elevated" : "text-text-secondary hover:text-white hover:bg-bg-elevated"
              )}
            >
              <div className="w-[48px] h-full flex items-center justify-center shrink-0">
                <tab.icon size={20} className={active ? "text-accent" : ""} />
              </div>
              
              <span className="font-mono text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}
