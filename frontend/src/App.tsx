import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ScrimTracker } from './pages/ScrimTracker';
import { Dashboard } from './pages/Dashboard';
import { PlayerPerformance } from './pages/PlayerPerformance';
import { MatchDetails } from './pages/MatchDetails';
import { TeamAnalysis } from './pages/TeamAnalysis';
import { LandingPage } from './pages/LandingPage';
import { Sidebar } from './components/Sidebar';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';

function SplashScreen() {
  return (
    <div className="h-screen w-full bg-bg-base flex items-center justify-center">
       <div className="text-accent font-rajdhani text-4xl animate-pulse">VAL ANALYTICS</div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');

  if (loading) return <SplashScreen />;

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="flex h-screen w-full bg-bg-base text-text-primary font-body overflow-hidden">
        {user && currentTab !== 'landing' && currentTab !== 'login' && (
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        )}
        
        <main className={cn(
          "flex-1 relative flex flex-col h-full overflow-hidden transition-all duration-300", 
          (user && currentTab !== 'landing' && currentTab !== 'login') ? "ml-[72px]" : "ml-0"
        )}>
          {currentTab === 'landing' && <LandingPage onEnter={() => user ? setCurrentTab('dashboard') : setCurrentTab('login')} />}
          {currentTab === 'login' && !user && <Login />}
          {user && currentTab === 'dashboard' && <Dashboard onOpenMatch={() => setCurrentTab('match-details')} />} 
          {user && currentTab === 'player-performance' && <PlayerPerformance />}
          {user && currentTab === 'scrim-tracker' && <ScrimTracker />}
          {user && currentTab === 'match-details' && <MatchDetails />}
          {user && currentTab === 'team-analysis' && <TeamAnalysis />}
        </main>
      </div>
    </>
  );
}

export default App;
