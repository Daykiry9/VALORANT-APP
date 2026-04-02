import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ScrimTracker } from './pages/ScrimTracker';
import { Dashboard } from './pages/Dashboard';
import { PlayerPerformance } from './pages/PlayerPerformance';
import { MatchDetails } from './pages/MatchDetails';
import { TeamAnalysis } from './pages/TeamAnalysis';
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
          {currentTab === 'team-analysis' && <TeamAnalysis />}
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
