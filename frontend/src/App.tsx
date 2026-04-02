import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ScrimTracker } from './pages/ScrimTracker';
import { Dashboard } from './pages/Dashboard';
import { PlayerPerformance } from './pages/PlayerPerformance';
import { MatchDetails } from './pages/MatchDetails';
import { Sidebar } from './components/Sidebar';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <React.Fragment>
      <Toaster position="bottom-right" />
      <div className="flex h-screen w-full bg-bg-base text-text-primary font-body overflow-hidden">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        
        {/* Main Content routing placeholder */}
        <div className="flex-1 ml-[72px] relative flex flex-col h-full overflow-hidden">
          {currentTab === 'dashboard' && <Dashboard onOpenMatch={(id) => setCurrentTab('match-details')} />} 
          {currentTab === 'player-performance' && <PlayerPerformance />}
          {currentTab === 'scrim-tracker' && <ScrimTracker />}
          {currentTab === 'match-details' && <MatchDetails />}
          {!['dashboard', 'player-performance', 'scrim-tracker', 'match-details'].includes(currentTab) && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary h-full relative">
              <div className="z-10 text-center">
                <h1 className="text-3xl font-display uppercase tracking-widest text-white mb-4 shadow-black drop-shadow-md">MODULE {currentTab.toUpperCase()} IN DEVELOPMENT</h1>
                <p className="font-mono text-sm max-w-md mx-auto p-4 bg-bg-surface/80 border border-border-default backdrop-blur-md">
                   This module is scheduled for Phase 4 deployment. Stand by for further updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
