import React from 'react';
import { BarChart3, TrendingUp, Users, Target, Activity, Share2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';

const seasonalData = [
  { name: 'Week 1', wins: 4, losses: 2, winRate: 66, kda: 1.1 },
  { name: 'Week 2', wins: 5, losses: 1, winRate: 83, kda: 1.3 },
  { name: 'Week 3', wins: 3, losses: 3, winRate: 50, kda: 0.9 },
  { name: 'Week 4', wins: 6, losses: 0, winRate: 100, kda: 1.6 },
];

const teamStatsRadar = [
  { subject: 'Utility', A: 120, B: 110, fullMark: 150 },
  { subject: 'Entry', A: 98, B: 130, fullMark: 150 },
  { subject: 'Clutch', A: 86, B: 130, fullMark: 150 },
  { subject: 'Economy', A: 99, B: 100, fullMark: 150 },
  { subject: 'Retakes', A: 85, B: 90, fullMark: 150 },
  { subject: 'Pistol', A: 65, B: 85, fullMark: 150 },
];

export function TeamAnalysis() {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-bg-base">
      <div className="flex justify-between items-center mb-8 border-b-2 border-accent pb-4">
        <div>
          <span className="text-accent font-mono text-xs tracking-[0.3em] uppercase">Phase 5: Pro Insights</span>
          <h1 className="text-3xl font-display font-medium text-white tracking-wider uppercase">
            Team Global Analysis
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-accent/10 border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-white transition-all font-mono text-sm">
          <Share2 size={16} /> EXPORT SEASON REPORT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Radar Chart: Team Identity */}
        <div className="lg:col-span-1 bg-bg-surface border border-border-default p-6">
          <h3 className="font-display text-sm text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Users size={16} className="text-accent" /> Team Strategic Identity
          </h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamStatsRadar}>
                  <PolarGrid stroke="#2D2D35" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8F8F9B', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                  <Radar
                    name="Our Team"
                    dataKey="A"
                    stroke="#FF4655"
                    fill="#FF4655"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Global Avg"
                    dataKey="B"
                    stroke="#00D4AA"
                    fill="#00D4AA"
                    fillOpacity={0.2}
                  />
                  <Legend />
                </RadarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Global Progress Chart */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-default p-6">
          <h3 className="font-display text-sm text-text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={16} className="text-[#00D4AA]" /> Seasonal Performance Trends
          </h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={seasonalData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D2D35" />
                 <XAxis dataKey="name" stroke="#8F8F9B" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis stroke="#8F8F9B" fontSize={10} tickLine={false} axisLine={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1A1A1E', border: '1px solid #2D2D35', color: '#fff' }}
                 />
                 <Legend />
                 <Area type="monotone" dataKey="winRate" fill="#00D4AA" fillOpacity={0.1} stroke="#00D4AA" />
                 <Bar dataKey="wins" barSize={20} fill="#FF4655" />
                 <Bar dataKey="losses" barSize={20} fill="#2D2D35" />
               </ComposedChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Map Win% Progress */}
         <div className="bg-bg-surface border border-border-default p-6">
            <h3 className="font-display text-sm text-text-secondary uppercase tracking-widest mb-4">MAP POOL EFFICIENCY</h3>
            <div className="space-y-4">
              {['Ascent', 'Bind', 'Haven', 'Split'].map((map, i) => (
                <div key={map} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
                    <span className="text-white">{map}</span>
                    <span className="text-text-secondary">{75 - i*10}% WIN RATE</span>
                  </div>
                  <div className="h-1 bg-bg-base w-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-success' : 'bg-accent'}`}
                      style={{ width: `${75 - i*10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
         </div>

         {/* Advanced Heatmap Placeholder */}
         <div className="bg-accent/5 border border-accent/20 p-6 flex flex-col justify-center items-center text-center">
            <BarChart3 className="text-accent mb-4" size={48} />
            <h4 className="font-display text-white uppercase tracking-widest mb-2">Kill Trajectory Heatmaps</h4>
            <p className="text-text-secondary font-mono text-[10px] max-w-xs mx-auto">
               Visualizing spatial dominance using VCT coordinate data. This module is active for Premier and Franchise teams.
            </p>
            <button className="mt-4 bg-accent text-white px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
               UPGRADE FOR SPATIAL DATA
            </button>
         </div>
      </div>
    </div>
  );
}
