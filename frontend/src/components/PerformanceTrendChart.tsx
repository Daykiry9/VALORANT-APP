import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { match: '1', acs: 210, kd: 1.1 },
  { match: '2', acs: 250, kd: 1.3 },
  { match: '3', acs: 180, kd: 0.9 },
  { match: '4', acs: 300, kd: 1.8 },
  { match: '5', acs: 220, kd: 1.2 },
  { match: '6', acs: 270, kd: 1.5 },
  { match: '7', acs: 190, kd: 0.95 },
  { match: '8', acs: 280, kd: 1.6 },
  { match: '9', acs: 240, kd: 1.3 },
  { match: '10', acs: 310, kd: 1.9 },
];

export function PerformanceTrendChart() {
  return (
    <div className="w-full h-64 bg-bg-surface border border-border-default p-4 mt-8">
      <h3 className="font-display uppercase text-text-secondary text-xs mb-4 tracking-widest">PERFORMANCE TREND (Last 10)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="match" stroke="#7A7A8C" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#7A7A8C" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 20', 'dataMax + 20']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111114', border: '1px solid #FF4655', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#fff' }}
            cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="acs" 
            stroke="#FF4655" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#FF4655', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#fff', stroke: '#FF4655', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
