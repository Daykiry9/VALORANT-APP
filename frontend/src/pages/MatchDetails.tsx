import React from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Target, Zap, TrendingUp, Clock, Map as MapIcon, Award, Sparkles, Loader2, FileDown } from 'lucide-react';

export function MatchDetails() {
  const { matchId } = useParams();
  const [aiInsight, setAiInsight] = React.useState<string | null>(null);
  const [loadingAi, setLoadingAi] = React.useState(false);

  const handleExportPDF = () => {
    // In real app: window.open(`/api/reports/match/${matchId}/pdf`, '_blank');
    alert("Exporting Tactical PDF Report (Franchise Tier Feature)");
  };

  const getAiInsight = async () => {
    setLoadingAi(true);
    try {
      // API call placeholder - in real app use axios/fetch to POST /api/ai/match/{id}/insights
      await new Promise(r => setTimeout(r, 2000)); // Simulación
      setAiInsight("### ANÁLISIS WAR ROOM (GEMINI 2.0 FLASH)\n\nLa partida en **Ascent** mostró una clara ventaja en el lado defensor (13-10). El jugador **Juan** tuvo un impacto crítico con 3 FB, dominando el sitio de A. \n\n**Debilidad:** Se detectaron 2 muertes tempranas en medio sin cobertura de utilidad.\n**Sugerencia:** Rotar centinelas hacia el 'market' más rápido cuando se detecte presión de humos.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Mock match data
  const match = {
    id: matchId,
    map: 'Ascent',
    score: '13 - 10',
    result: 'W',
    date: '2024-03-28',
    opponent: 'Team Liquid',
    stats: {
      acs: 245,
      kd: '1.24',
      adr: 156,
      hs: '24%'
    },
    rounds: [
      { number: 1, winner: 'Team', type: 'Pistol', events: [{ type: 'Kill', actor: 'Juan', victim: 'ScreaM', weapon: 'Classic' }] },
      { number: 2, winner: 'Team', type: 'Eco', events: [] },
      { number: 3, winner: 'Opponent', type: 'Full Buy', events: [] },
    ]
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8 border-b-2 border-accent pb-4 flex justify-between items-end">
        <div>
          <span className="text-accent font-mono text-xs tracking-[0.3em] uppercase">MATCH ANALYSIS</span>
          <h1 className="text-3xl font-display font-medium text-white tracking-wider uppercase flex items-center gap-4">
            {match.map} <span className={match.result === 'W' ? 'text-[#00D4AA]' : 'text-accent'}>{match.score}</span>
          </h1>
          <p className="text-text-secondary font-mono text-sm mt-1 uppercase">VS {match.opponent} • {match.date}</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-bg-surface border border-border-default text-white px-4 py-2 font-mono text-[10px] hover:bg-bg-base transition-all">VOD LINK</button>
           <button 
             onClick={handleExportPDF}
             className="bg-accent text-white px-4 py-2 font-mono text-[10px] font-bold hover:bg-white hover:text-black transition-all flex items-center gap-2"
           >
             <FileDown size={14} /> EXPORT PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-surface border border-border-default p-4">
          <div className="text-text-secondary font-mono text-[10px] mb-1">TEAM ACS</div>
          <div className="text-2xl text-white font-display">245</div>
        </div>
        <div className="bg-bg-surface border border-border-default p-4">
          <div className="text-text-secondary font-mono text-[10px] mb-1">FB / FD</div>
          <div className="text-2xl text-white font-display">12 / 8</div>
        </div>
        <div className="bg-bg-surface border border-border-default p-4">
          <div className="text-text-secondary font-mono text-[10px] mb-1">CLUTCH %</div>
          <div className="text-2xl text-white font-display">18%</div>
        </div>
        <div className="bg-bg-surface border border-border-default p-4">
          <div className="text-text-secondary font-mono text-[10px] mb-1">ECON RATING</div>
          <div className="text-2xl text-white font-display">64</div>
        </div>
      </div>

      {/* Round Timeline */}
      <div className="bg-bg-surface border border-border-default overflow-hidden">
        <div className="bg-bg-base p-4 border-b border-border-default">
           <h3 className="font-display text-sm tracking-widest text-white uppercase flex items-center gap-2">
             <Clock size={16} className="text-accent" /> ROUND BY ROUND TIMELINE
           </h3>
        </div>
        <div className="p-6">
           <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {Array.from({ length: 23 }).map((_, i) => (
                <div key={i} className={`flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center border font-mono text-xs cursor-pointer transition-all hover:scale-110
                  ${i < 13 ? 'bg-[#00D4AA]/10 border-[#00D4AA]/30 text-[#00D4AA]' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                  <span className="text-[8px] opacity-70">R</span>
                  {i + 1}
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                 <h4 className="font-display text-xs text-text-secondary mb-4 uppercase tracking-[0.2em]">KILL FEED</h4>
                 <div className="space-y-3">
                    {[
                      { time: '1:42', actor: 'Juan', agent: 'Jett', victim: 'TenZ', v_agent: 'Omen', weapon: 'Vandal' },
                      { time: '1:12', actor: 'Pedro', agent: 'Sova', victim: 'Sacy', v_agent: 'Skye', weapon: 'Phantom' },
                      { time: '0:54', actor: 'Opponent', agent: 'Killjoy', victim: 'Luis', v_agent: 'Cypher', weapon: 'Shorty', is_enemy: true },
                    ].map((kill, i) => (
                       <div key={i} className={`flex items-center justify-between p-3 border-l-2 font-mono text-xs ${kill.is_enemy ? 'bg-accent/5 border-accent' : 'bg-[#00D4AA]/5 border-[#00D4AA]'}`}>
                          <div className="flex items-center gap-3">
                             <span className="text-text-secondary text-[10px]">{kill.time}</span>
                             <span className="text-white font-bold">{kill.actor}</span>
                             <span className="text-text-secondary text-[10px]">({kill.agent})</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <Target size={12} className="text-text-secondary" />
                             <span className="text-white font-bold">{kill.victim}</span>
                             <span className="text-text-secondary text-[10px]">({kill.v_agent})</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div>
                 <h4 className="font-display text-xs text-text-secondary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Sparkles size={14} className="text-amber-500" /> TACTICAL AI INSIGHTS
                 </h4>
                 <div className="bg-amber-500/5 border border-amber-500/20 p-6 min-h-[200px] flex flex-col justify-center items-center">
                    {!aiInsight ? (
                      <div className="text-center">
                        <p className="text-amber-500/70 font-mono text-[10px] mb-4">Análisis por Gemini 2.0 Flash</p>
                        <button 
                          onClick={getAiInsight}
                          disabled={loadingAi}
                          className="bg-amber-500 text-black px-4 py-2 font-mono text-[10px] font-bold hover:bg-white transition-all flex items-center gap-2"
                        >
                          {loadingAi ? <Loader2 className="animate-spin" size={14} /> : <Target size={14} />}
                          {loadingAi ? 'ANALIZANDO...' : 'GENERAR TACTICAL BREIFING'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-white font-mono text-[12px] whitespace-pre-wrap leading-relaxed">
                        {aiInsight}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
