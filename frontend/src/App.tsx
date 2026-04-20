import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Target } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { TeamProvider } from './context/TeamContext';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ScrimTracker } from './pages/ScrimTracker';
import { PlayerPerformance } from './pages/PlayerPerformance';
import { TeamAnalysis } from './pages/TeamAnalysis';
import { Tryouts } from './pages/Tryouts';
import { Roster } from './pages/Roster';
import { MatchDetails } from './pages/MatchDetails';
import { Settings } from './pages/Settings';

function SplashScreen() {
  return (
    <div className="h-screen w-full bg-bg-base flex items-center justify-center">
      <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-2xl animate-pulse shadow-glow-accent">
        <Target size={24} color="#fff" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <TeamProvider>
      <div className="flex h-screen w-full bg-bg-base text-text-primary font-body overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative flex flex-col h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </TeamProvider>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return <LandingPage onEnter={() => { window.location.href = user ? '/app/dashboard' : '/login'; }} />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scrims" element={<ScrimTracker />} />
          <Route path="team" element={<TeamAnalysis />} />
          <Route path="players" element={<PlayerPerformance />} />
          <Route path="players/:playerId" element={<PlayerPerformance />} />
          <Route path="tryouts" element={<Tryouts />} />
          <Route path="roster" element={<Roster />} />
          <Route path="matches/:matchId" element={<MatchDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
