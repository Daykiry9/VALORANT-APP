import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { X, Plus, Upload, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export function ScrimTracker() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [scrims, setScrims] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScrims();
  }, []);

  const loadScrims = async () => {
    try {
      const data = await api.getScrims();
      setScrims(data);
    } catch (err) {
      toast.error('Error loading scrims');
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'opponent_name', header: 'Rival' },
    { accessorKey: 'opponent_tier', header: 'Tier' },
    { accessorKey: 'map', header: 'Map' },
    { accessorKey: 'result', header: 'W/L/D' },
    { accessorKey: 'score', header: 'Score' },
    { accessorKey: 'vod', header: 'VOD' },
  ];

  const handleCreateScrim = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await api.createScrim(data);
      toast.success('Scrim Registered Successfully');
      setIsPanelOpen(false);
      loadScrims();
    } catch (err) {
      toast.error('Failed to register scrim');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing scoreboard (OCR)...');
    try {
      const result = await api.uploadScoreboard(file);
      toast.success('OCR Complete. Data extracted.');
      // In a real app we'd pre-fill the form with 'result' data
    } catch (err) {
      toast.error('OCR failed. Please enter data manually.');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto relative h-full">
      <div className="flex justify-between items-center mb-8 border-b-2 border-accent pb-4 relative">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-[rgba(255,255,255,0.05)] shadow-[0_4px_4px_rgba(255,70,85,0.2)]" />
        <h1 className="text-3xl font-display font-medium text-text-primary tracking-wider uppercase">
          SCRIM TRACKER Ops Log
        </h1>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 bg-accent/10 border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-white transition-all font-mono text-sm"
        >
          <Plus size={16} /> REGISTRAR SCRIM
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="flex items-center bg-bg-surface border border-border-default px-3 py-1 flex-1">
              <Search size={14} className="text-text-secondary mr-2" />
              <input placeholder="Buscar scrims, rivales..." className="bg-transparent outline-none w-full font-mono text-xs text-text-primary" />
            </div>
            <button className="flex items-center gap-2 border border-border-default px-4 py-1 text-xs font-mono hover:border-accent hover:text-accent transition-colors">
              <Filter size={14} /> FILTER
            </button>
          </div>
          
          <DataTable 
            columns={columns} 
            data={scrims} 
            loading={loading}
            className="min-h-[500px]"
          />
        </div>

        <div className="space-y-6 flex flex-col">
          <StatCard label="Win Rate vs Top Rivals" value={68.4} suffix="%" delta={-2.1} decimals={1} />
          
          <div className="bg-bg-surface border border-border-default p-4">
            <h3 className="font-display uppercase text-text-secondary text-sm mb-3">By Map Win%</h3>
            <div className="space-y-2">
              {['Bind', 'Split', 'Ascent'].map(map => (
                <div key={map} className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white">{map}</span>
                  <span className="text-success tracking-wider">75% (8-2)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Ingestion Panel */}
      {isPanelOpen && (
        <div className="fixed top-0 right-0 w-[450px] h-full bg-bg-surface border-l border-accent z-50 p-6 overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-border-default pb-4">
            <h2 className="text-xl font-display font-medium text-white tracking-widest">&gt;&gt; INGEST SCRIM DATA</h2>
            <button onClick={() => setIsPanelOpen(false)} className="text-text-secondary hover:text-accent transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateScrim} className="space-y-5 text-sm">
            <div>
              <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Rival Team</label>
              <input type="text" className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Date</label>
                <input type="date" className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent" required />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Tier</label>
                <select className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent">
                  <option>T1</option><option>T2</option><option>T3</option><option>T4</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Def Rounds Won</label>
                <input type="number" min="0" max="13" className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Atk Rounds Won</label>
                <input type="number" min="0" max="13" className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent" />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">VOD URL (YouTube/Twitch)</label>
              <input type="url" placeholder="https://..." className="w-full bg-bg-base border border-border-default p-2 text-white outline-none focus:border-accent" />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-text-secondary mb-1">Upload Scoreboard Image (OCR Auth)</label>
              <label className="w-full border-2 border-dashed border-border-default bg-bg-base p-6 flex flex-col items-center justify-center text-text-secondary hover:border-accent hover:text-accent cursor-pointer transition-colors group">
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                <span className="font-mono text-[10px]">DROP 16:9 SCREENSHOT HERE</span>
              </label>
            </div>

            <div className="pt-4 mt-8 border-t border-border-default">
              <button type="submit" className="w-full bg-accent text-white font-mono font-bold tracking-wider py-3 hover:bg-accent/80 transition-colors flex justify-center items-center gap-2">
                CONFIRM & REGISTRAR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
