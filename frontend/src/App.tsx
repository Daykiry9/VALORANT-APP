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

  // Automatic redirect to dashboard upon successful login
  React.useEffect(() => {
    if (user && (currentTab === 'landing' || currentTab === 'login')) {
      setCurrentTab('dashboard');
    }
  }, [user, currentTab]);

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="flex h-screen w-full bg-bg-base text-text-primary font-body overflow-hidden">
        {/* Sidebar visible only if logged in and not on landing */}
        {user && currentTab !== 'landing' && (
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        )}
        
        <main className={cn(
          "flex-1 relative flex flex-col h-full overflow-hidden transition-all duration-300", 
          (user && currentTab !== 'landing') ? "ml-[72px]" : "ml-0"
        )}>
          {/* Landing Page */}
          {currentTab === 'landing' && (
            <LandingPage onEnter={() => user ? setCurrentTab('dashboard') : setCurrentTab('login')} />
          )}

          {/* Login Page (if not logged in) */}
          {currentTab === 'login' && !user && <Login />}

          {/* Protected Routes */}
          {user ? (
            <>
              {currentTab === 'dashboard' && <Dashboard onOpenMatch={() => setCurrentTab('match-details')} />} 
              {currentTab === 'player-performance' && <PlayerPerformance />}
              {currentTab === 'scrim-tracker' && <ScrimTracker />}
              {currentTab === 'match-details' && <MatchDetails />}
              {currentTab === 'team-analysis' && <TeamAnalysis />}
            </>
          ) : (
             // If user is NOT logged in but trying to access protected tab, force login
             currentTab !== 'landing' && currentTab !== 'login' && <Login />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
