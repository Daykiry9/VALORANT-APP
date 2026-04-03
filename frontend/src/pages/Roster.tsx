import React from 'react';
import { Users } from 'lucide-react';
import { api } from '../lib/api';

export function Roster() {
  const handleLinkRSO = (id: string) => {
    window.location.href = `http://localhost:8000/api/auth/riot/auth-url?player_id=${id}`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-rajdhani font-bold tracking-tight uppercase">
            ROSTER COMMAND
          </h1>
          <p className="text-text-secondary mt-2">Gestión de panel de jugadores y estado de RSO.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="bg-bg-surface border border-border-default rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl">
                    P1
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">Player 1</h3>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded">Duelist</span>
                 </div>
              </div>
              <div className="mb-4">
                 <span className="text-xs text-text-secondary mr-2">Estado RSO:</span>
                 <span className="text-xs font-bold text-amber-500 uppercase">Sin Vincular</span>
              </div>
              <button 
                onClick={() => handleLinkRSO("demo_id")}
                className="w-full bg-white/5 border border-white/10 py-2 rounded text-sm hover:bg-accent hover:border-accent hover:text-white transition-all"
              >
                 Vincular Riot
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
