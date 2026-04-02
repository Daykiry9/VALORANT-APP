import React from 'react';
import { cn } from '../lib/utils';

interface MapStats {
  name: string;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  defRounds: number;
  atkRounds: number;
}

const MAP_STATS: MapStats[] = [
  { name: 'Bind', winRate: 75, wins: 8, losses: 2, draws: 0, defRounds: 65, atkRounds: 58 },
  { name: 'Ascent', winRate: 60, wins: 6, losses: 4, draws: 0, defRounds: 45, atkRounds: 50 },
  { name: 'Haven', winRate: 40, wins: 4, losses: 6, draws: 1, defRounds: 40, atkRounds: 60 },
  { name: 'Split', winRate: 85, wins: 12, losses: 2, draws: 0, defRounds: 80, atkRounds: 50 },
  { name: 'Icebox', winRate: 50, wins: 5, losses: 5, draws: 0, defRounds: 30, atkRounds: 30 },
  { name: 'Lotus', winRate: 35, wins: 3, losses: 7, draws: 0, defRounds: 25, atkRounds: 35 },
];

export function MapHeatmap() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {MAP_STATS.map((map) => {
        const isGood = map.winRate >= 60;
        const isBad = map.winRate <= 40;
        
        return (
          <div
            key={map.name}
            className={cn(
              "relative h-32 overflow-hidden border border-border-default hover:border-white transition-colors group cursor-pointer",
              isGood ? "bg-success/10" : isBad ? "bg-accent/10" : "bg-bg-surface"
            )}
          >
            {/* Background Map Placeholder */}
            <div className={cn(
              "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity",
              isGood ? "bg-success" : isBad ? "bg-accent" : "bg-gray-500"
            )} />
            
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-display font-bold uppercase text-white tracking-wider text-xl">
                  {map.name}
                </span>
                <span className={cn(
                  "font-mono text-2xl font-bold",
                  isGood ? "text-success" : isBad ? "text-accent" : "text-white"
                )}>
                  {map.winRate}%
                </span>
              </div>
              
              <div className="flex justify-between items-end font-mono text-xs">
                <span className="text-text-secondary">W{map.wins} L{map.losses}</span>
                <div className="flex w-1/2 h-1 bg-bg-base overflow-hidden">
                  <div style={{ width: `${(map.defRounds / (map.defRounds + map.atkRounds)) * 100}%` }} className="bg-blue-400" />
                  <div style={{ width: `${(map.atkRounds / (map.defRounds + map.atkRounds)) * 100}%` }} className="bg-red-400" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
