import React from 'react';
import { StatCard } from '../components/StatCard';
import { PerformanceTrendChart } from '../components/PerformanceTrendChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Shield, Target, Zap, TrendingUp } from 'lucide-react';

export function PlayerPerformance() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8 border-b-2 border-accent pb-4 relative flex justify-between items-end">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-[rgba(255,255,255,0.05)] shadow-[0_4px_4px_rgba(255,70,85,0.2)]" />
        <div>
          <h1 className="text-3xl font-display font-medium text-white tracking-wider uppercase">
            TENZ
          </h1>
          <p className="text-accent font-mono text-sm">Role: Duelist / Entry Fragger</p>
        </div>
        <div className="flex gap-2">
           {['TENZ', 'ZETA', 'BOASTER', 'FNC', 'SEN'].map(player => (
               <div key={player} className="h-10 w-10 bg-bg-surface border border-border-default hover:border-accent cursor-pointer flex items-center justify-center font-display font-bold text-xs uppercase transition-colors">
                 {player.substring(0,2)}
               </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-8">
        <StatCard label="ACS" value={264.3} decimals={1} className="bg-bg-elevated border-accent/30" />
        <StatCard label="K/D" value={1.34} decimals={2} />
        <StatCard label="KAST%" value={74.2} suffix="%" decimals={1} />
        <StatCard label="ADR" value={168.5} decimals={1} />
        <StatCard label="HS%" value={32.1} suffix="%" decimals={1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Death Order Donut */}
        <div className="bg-bg-surface border border-border-default p-5">
          <h3 className="font-display uppercase tracking-widest text-text-secondary text-xs mb-4">DEATH ORDER DISTRIBUTION</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'First Death', value: 15 },
                    { name: 'Early', value: 20 },
                    { name: 'Mid', value: 30 },
                    { name: 'Last', value: 10 },
                    { name: 'Survived', value: 25 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#FF4655" />
                  <Cell fill="#FF8A00" />
                  <Cell fill="#7A7A8C" />
                  <Cell fill="#00D4AA" />
                  <Cell fill="#FFFFFF" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111114', border: '1px solid #FF4655', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
             <div className="flex items-center gap-1 text-[8px] font-mono"><div className="h-2 w-2 bg-[#FF4655]"/> FD</div>
             <div className="flex items-center gap-1 text-[8px] font-mono"><div className="h-2 w-2 bg-[#FF8A00]"/> EARLY</div>
             <div className="flex items-center gap-1 text-[8px] font-mono"><div className="h-2 w-2 bg-[#FFFFFF]"/> SURVIVED</div>
          </div>
        </div>

        {/* Clutch Performance */}
        <div className="bg-bg-surface border border-border-default p-5">
           <h3 className="font-display uppercase tracking-widest text-text-secondary text-xs mb-4">CLUTCH CONVERSION</h3>
           <div className="space-y-6 mt-4">
              {[
                { label: '1vs1', won: 8, opp: 12, color: '#00D4AA' },
                { label: '1vs2', won: 3, opp: 9, color: '#FF8A00' },
                { label: '1vs3+', won: 1, opp: 5, color: '#FF4655' }
              ].map(clutch => (
                <div key={clutch.label}>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-white">{clutch.label}</span>
                    <span className="text-text-secondary">{clutch.won}/{clutch.opp} ({Math.round(clutch.won/clutch.opp*100)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-base overflow-hidden">
                    <div style={{ width: `${(clutch.won/clutch.opp)*100}%`, backgroundColor: clutch.color }} className="h-full" />
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Benchmarks vs VCT */}
        <div className="bg-bg-surface border border-border-default p-5">
          <h3 className="font-display uppercase tracking-widest text-text-secondary text-xs mb-4">BENCHMARK VS PRO ROLE</h3>
          <div className="space-y-3 font-mono text-[11px]">
             {[ 
               { m: 'ACS', val: 218, pro: 235 },
               { m: 'K/D', val: 1.2, pro: 1.3 },
               { m: 'KAST%', val: '68%', pro: '72%' },
               { m: 'FB Rate', val: '15%', pro: '18%' }
             ].map(i => (
               <div key={i.m} className="flex flex-col gap-1">
                 <div className="flex justify-between">
                   <span className="text-text-secondary">{i.m}</span>
                   <span className="text-white">{i.val} <span className="text-text-secondary">/ {i.pro}</span></span>
                 </div>
                 <div className="h-1 w-full bg-bg-base">
                    <div style={{ width: `${(parseFloat(i.val as string)/parseFloat(i.pro as string))*100}%` }} className="h-full bg-accent" />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-bg-surface border border-border-default p-5">
          <h3 className="font-display uppercase tracking-widest text-accent border-b border-border-default pb-2 mb-4">OFFENSIVE</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">FB Rate</span><span className="text-white">22%</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Kills/Round</span><span className="text-white">0.92</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Multi-Kills</span><span className="text-white">18</span></div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default p-5">
          <h3 className="font-display uppercase tracking-widest text-[#00D4AA] border-b border-border-default pb-2 mb-4">SURVIVAL</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">FD Rate</span><span className="text-white">14%</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Clutch Rate</span><span className="text-white">15%</span></div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default p-5">
          <h3 className="font-display uppercase tracking-widest text-[#FF8A00] border-b border-border-default pb-2 mb-4">SUPPORT</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Assists/Round</span><span className="text-white">0.31</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Trade %</span><span className="text-white">68%</span></div>
          </div>
        </div>
      </div>

      <PerformanceTrendChart />
    </div>
  );
}
