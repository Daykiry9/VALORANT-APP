import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, Plus, ArrowRight, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export function Tryouts() {
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [displayedInsight, setDisplayedInsight] = useState('');

  useEffect(() => {
    if (!aiInsight) return;
    let i = 0;
    setDisplayedInsight('');
    const timer = setInterval(() => {
      setDisplayedInsight(aiInsight.slice(0, i));
      i++;
      if (i > aiInsight.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [aiInsight]);

  const handleGenerateInsight = async () => {
    setLoadingAI(true);
    setAiInsight("Analizando métricas comparativas...\n\n### ⚡ Ventaja Táctica\nEl Jugador 1 muestra un ACS superior, pero el Jugador 2 tiene un KAST% mucho más alto, lo que indica mejor juego en equipo.\n\n### 🎯 Conclusión\nDepende del rol. Si buscas un duelista agresivo, Jugador 1. Si buscas consistencia y tradeo, Jugador 2.");
    setLoadingAI(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-rajdhani font-bold tracking-tight uppercase">
            TRYOUT COMPARATOR — INTEL ROOM
          </h1>
          <p className="text-text-secondary mt-2">Compara métricas de desempeño entre candidatos para roles específicos.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[0, 1].map(index => (
            <div key={index} className="bg-bg-elevated border border-dashed border-border-default rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center text-text-secondary mb-4">
                <UserPlus size={20} />
              </div>
              <input 
                className="bg-transparent border-b border-border-default text-center px-4 py-2 outline-none focus:border-accent text-white"
                placeholder="Riot ID o Nombre"
                value={players[index]}
                onChange={e => {
                  const newPlayers = [...players];
                  newPlayers[index] = e.target.value;
                  setPlayers(newPlayers);
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-bg-surface border border-border-default rounded-xl p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs uppercase">
                 <th className="py-4">Métrica</th>
                 <th className="py-4 text-center">Jugador 1</th>
                 <th className="py-4 text-center">Jugador 2</th>
              </tr>
            </thead>
            <tbody>
              {['ACS', 'K/D', 'KAST%', 'ADR', 'FB Rate'].map((metric, i) => (
                <tr key={i} className="border-b border-border-default/30">
                  <td className="py-4 text-sm">{metric}</td>
                  <td className="py-4 text-center font-mono">--</td>
                  <td className="py-4 text-center font-mono">--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-bg-elevated border-l-4 border-accent p-6 flex flex-col">
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAI}
            className="self-start bg-accent text-white px-6 py-2 rounded font-bold text-xs uppercase mb-4"
          >
            GENERAR ANÁLISIS COMPARATIVO
          </button>
          
          <div className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap min-h-[100px]">
             {displayedInsight}
          </div>
        </div>

      </div>
    </div>
  );
}
