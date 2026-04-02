import React from 'react';
import { StatCard } from '../components/StatCard';
import { MapHeatmap } from '../components/MapHeatmap';
import { Shield } from 'lucide-react';

interface DashboardProps {
  onOpenMatch?: (id: string) => void;
}

export function Dashboard({ onOpenMatch }: DashboardProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* 4.1 RSO Opt-in Banner */}
      <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between group hover:bg-amber-500/20 transition-all">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-white font-display text-sm font-bold tracking-widest">⚡ 2 DE 5 JUGADORES VINCULADOS</h4>
            <p className="text-amber-500/70 font-mono text-[10px] uppercase">Vincula más cuentas Riot para activar el auto-import de partidas oficiales y custom games.</p>
          </div>
        </div>
        <button className="bg-amber-500 text-black px-4 py-2 font-mono text-[10px] font-bold hover:bg-white transition-colors">
          INVITAR JUGADORES {'->'}
        </button>
      </div>

      <div className="mb-8 border-b-2 border-accent pb-4 relative">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-[rgba(255,255,255,0.05)] shadow-[0_4px_4px_rgba(255,70,85,0.2)]" />
        <h1 className="text-3xl font-display font-medium text-white tracking-wider uppercase">
          GLOBAL HQ DASHBOARD
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="WINRATE GLOBAL" value={71.4} suffix="%" delta={3.2} decimals={1} className="lg:col-span-1" />
        <StatCard label="PARTIDAS TOTALES" value={47} prefix="" className="lg:col-span-1" />
        
        <div className="bg-bg-surface border border-border-default p-4 hover:border-accent transition-colors lg:col-span-1">
          <span className="text-[10px] font-mono uppercase text-text-secondary mb-2 tracking-wider block">RACHA RECIENTE</span>
          <div className="flex gap-2 items-center h-full pb-4">
            {['W', 'W', 'W', 'L', 'W'].map((res, i) => (
              <div key={i} className={`flex-1 h-8 flex items-center justify-center font-mono text-xs font-bold ${
                res === 'W' ? 'bg-success/20 text-success border border-success' : 'bg-accent/20 text-accent border border-accent'
              }`}>
                {res}
              </div>
            ))}
          </div>
        </div>

        <StatCard label="MAP POOL ACTIVOS" value={5} className="lg:col-span-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-display uppercase tracking-widest mb-4 border-l-4 border-accent pl-2">SCRIMS vs OFFICIAL</h2>
          <div className="bg-bg-surface border border-border-default p-6 font-mono text-sm">
            <div className="flex justify-between border-b border-border-default pb-2 mb-4 text-text-secondary uppercase text-[10px]">
              <span>Scrims</span>
              <span>Metric</span>
              <span>Official</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-accent">218</span>
                <span className="text-white group-hover:text-accent transition-colors">ACS Avg</span>
                <span className="text-success">225</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-accent">1.42</span>
                <span className="text-white group-hover:text-accent transition-colors">K/D</span>
                <span className="text-success">1.51</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-success">73%</span>
                <span className="text-white group-hover:text-accent transition-colors">Win Rate</span>
                <span className="text-accent">64%</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display uppercase tracking-widest mb-4 border-l-4 border-accent pl-2">MAP PERFORMANCE</h2>
          <MapHeatmap />
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default overflow-hidden">
        <div className="bg-bg-base p-4 border-b border-border-default flex justify-between items-center">
          <h2 className="text-sm font-display uppercase tracking-widest text-white">HISTORIAL RECIENTE</h2>
          <span className="text-text-secondary font-mono text-[10px]">ULTIMAS 10 PARTIDAS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-secondary uppercase text-[10px]">
                <th className="p-4">MAPA</th>
                <th className="p-4">RESULTADO</th>
                <th className="p-4">SCORE</th>
                <th className="p-4">OPONENTE</th>
                <th className="p-4">FECHA</th>
                <th className="p-4 text-right">ACCION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/30">
              {[
                { id: '1', map: 'Ascent', res: 'W', score: '13-10', opp: 'Team Liquid', date: '2024-03-28' },
                { id: '2', map: 'Bind', res: 'W', score: '13-5', opp: 'LOUD', date: '2024-03-27' },
                { id: '3', map: 'Split', res: 'L', score: '11-13', opp: 'NRG', date: '2024-03-25' },
              ].map(match => (
                <tr key={match.id} className="hover:bg-accent/5 transition-colors group cursor-pointer" onClick={() => onOpenMatch?.(match.id)}>
                  <td className="p-4 text-white font-bold">{match.map}</td>
                  <td className="p-4">
                    <span className={match.res === 'W' ? 'text-success' : 'text-accent'}>{match.res}</span>
                  </td>
                  <td className="p-4 text-text-secondary">{match.score}</td>
                  <td className="p-4 text-white">{match.opp}</td>
                  <td className="p-4 text-text-secondary">{match.date}</td>
                  <td className="p-4 text-right">
                    <button className="text-accent opacity-0 group-hover:opacity-100 transition-opacity font-bold">ANALIZAR {'->'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
