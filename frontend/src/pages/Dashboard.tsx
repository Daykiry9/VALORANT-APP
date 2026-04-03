import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Loader2, 
  Plus, 
  Search, 
  ArrowUpRight, 
  MapPin, 
  TrendingUp, 
  Zap,
  Target
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export function Dashboard({ onOpenMatch }: { onOpenMatch?: (id: string) => void }) {
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const matches = await api.getScrims(10);
      setRecentMatches(matches);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasData = recentMatches.length > 0;

  const totalMatches = recentMatches.length;
  const wins = recentMatches.filter(m => m.result === 'W').length;
  const winRate = totalMatches > 0 ? (wins / totalMatches * 100) : 0;
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <Loader2 className="text-accent animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 bg-bg-base">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-rajdhani font-bold text-text-primary tracking-tight uppercase">
              Global Command Center
            </h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Análisis táctico y métricas de desempeño del equipo.</p>
          </div>
          <button className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,70,85,0.2)]">
            <Plus size={18} /> Nueva Scrim
          </button>
        </div>

        {/* Banner: RSO Linking */}
        {!hasData && (
          <div className="rounded-2xl p-6 border border-accent/20 bg-accent/5 flex items-center justify-between group">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent ring-1 ring-accent/20 transition-all group-hover:scale-110">
                <Zap size={24} fill="currentColor" />
              </div>
              <div>
                <h4 className="text-text-primary font-bold text-lg">Impulsa tus métricas</h4>
                <p className="text-text-secondary text-sm">Vincula tu cuenta de Riot Games para importar automáticamente tus partidas oficiales y análisis detallado.</p>
              </div>
            </div>
            <button className="bg-text-primary text-bg-base px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              VINCULAR RSO
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Winrate Global', value: hasData ? `${winRate.toFixed(1)}%` : '--%', icon: TrendingUp, positive: true, label_delta: 'Subida desde 0' },
            { label: 'Partidas Totales', value: hasData ? totalMatches : '0', icon: Target, label_delta: 'Sube una scrim' },
            { label: 'ACS Promedio', value: hasData ? '218' : '---', icon: Activity, label_delta: 'Rendimiento individual' },
            { label: 'Agente Top', value: hasData ? 'Jett' : 'N/A', icon: MapPin, label_delta: 'Basado en scrims' },
          ].map((m, i) => (
            <div key={i} className="bg-bg-surface border border-border-default rounded-2xl p-6 transition-all hover:bg-bg-elevated hover:border-accent/30 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:bg-accent/10 transition-all">
                  <m.icon size={16} />
                </div>
                <ArrowUpRight size={14} className="text-text-secondary group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">{m.label}</div>
              <div className="text-3xl font-rajdhani font-bold text-text-primary group-hover:text-accent transition-all">{m.value}</div>
              <p className="text-[10px] mt-2 text-text-secondary flex items-center gap-1">
                {m.label_delta}
              </p>
            </div>
          ))}
        </div>

        {/* Content Section: Table & Map Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* History Table */}
          <div className="lg:col-span-8 bg-bg-surface border border-border-default rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border-default flex items-center justify-between">
              <h3 className="font-rajdhani font-bold text-lg uppercase tracking-wider">Historial de Operaciones</h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-success" /> OPERATIVO
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-default text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    <th className="px-6 py-4">Mapa</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Resultado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50">
                  {recentMatches.map((m) => (
                    <tr key={m.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => onOpenMatch?.(m.id)}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-text-primary uppercase tracking-tight">{m.map_name}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5">{new Date(m.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase",
                          m.result === 'W' ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                        )}>
                          MATCH {m.result === 'W' ? 'WON' : 'DEFEAT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                        {m.team_rounds_won} — {m.team_rounds_lost}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[10px] font-bold text-accent px-3 py-1 rounded border border-accent/20 group-hover:bg-accent group-hover:text-white transition-all uppercase">Analizar Intel</button>
                      </td>
                    </tr>
                  ))}
                  {!hasData && [1,2,3].map(i => (
                    <tr key={i} className="opacity-20 pointer-events-none">
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-white/10 animate-pulse rounded" />
                      </td>
                      <td className="px-6 py-4">
                         <div className="h-4 w-16 bg-white/10 animate-pulse rounded" />
                      </td>
                      <td className="px-6 py-4">
                         <div className="h-4 w-8 bg-white/10 animate-pulse rounded" />
                      </td>
                      <td className="px-6 py-4">
                         <div className="h-4 w-24 ml-auto bg-white/10 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!hasData && (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-secondary">No hay scrims registradas todavía.</p>
                  <button className="text-accent text-xs font-bold mt-2 hover:underline">Sube el primer scoreboard</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tasks / Agent Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
              <h3 className="font-rajdhani font-bold text-lg uppercase mb-4 tracking-wider">Map Pool Efficiency</h3>
              <div className="space-y-4">
                {[
                  { map: 'Bind', wr: 76, color: 'bg-accent' },
                  { map: 'Ascent', wr: 54, color: 'bg-white/10' },
                  { map: 'Sunset', wr: 30, color: 'bg-white/10' },
                ].map((m) => (
                  <div key={m.map} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-text-primary">{m.map}</span>
                      <span className="text-text-secondary">{m.wr}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", m.color)} style={{ width: `${m.wr}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-transparent border border-accent/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all duration-500">
                <Target size={80} />
              </div>
              <h3 className="font-rajdhani font-bold text-lg uppercase mb-2 tracking-wider">Coach AI Intel</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Basado en tus últimas 10 rondas, el equipo está fallando la gestión de utilidad en sitios A.
              </p>
              <button className="text-[10px] font-bold text-accent border-b border-accent/30 flex items-center gap-1 hover:gap-2 transition-all">
                IR AL ANALIZADOR <ArrowUpRight size={10} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

const Activity = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
