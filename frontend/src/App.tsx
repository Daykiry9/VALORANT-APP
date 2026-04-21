import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Target } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { TeamProvider } from './context/TeamContext';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { OnboardingGate } from './components/OnboardingGate';

// Code-split each dashboard route so the landing/login bundle stays small.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ScrimTracker = lazy(() => import('./pages/ScrimTracker').then((m) => ({ default: m.ScrimTracker })));
const PlayerPerformance = lazy(() => import('./pages/PlayerPerformance').then((m) => ({ default: m.PlayerPerformance })));
const TeamAnalysis = lazy(() => import('./pages/TeamAnalysis').then((m) => ({ default: m.TeamAnalysis })));
const Tryouts = lazy(() => import('./pages/Tryouts').then((m) => ({ default: m.Tryouts })));
const Roster = lazy(() => import('./pages/Roster').then((m) => ({ default: m.Roster })));
const MatchDetails = lazy(() => import('./pages/MatchDetails').then((m) => ({ default: m.MatchDetails })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Scouting = lazy(() => import('./pages/Scouting').then((m) => ({ default: m.Scouting })));

function SplashScreen() {
  return (
    <div className="h-screen w-full bg-bg-base flex items-center justify-center">
      <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-2xl animate-pulse shadow-glow-accent">
        <Target size={24} color="#fff" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SplashScreen />}>{children}</Suspense>;
}

function AppShell() {
  return (
    <TeamProvider>
      <OnboardingGate>
        <div className="flex h-screen w-full bg-bg-base text-text-primary font-body overflow-hidden">
          <Sidebar />
          <main className="flex-1 relative flex flex-col h-full overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </OnboardingGate>
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
          <Route path="dashboard" element={<RouteSuspense><Dashboard /></RouteSuspense>} />
          <Route path="scrims" element={<RouteSuspense><ScrimTracker /></RouteSuspense>} />
          <Route path="team" element={<RouteSuspense><TeamAnalysis /></RouteSuspense>} />
          <Route path="players" element={<RouteSuspense><PlayerPerformance /></RouteSuspense>} />
          <Route path="players/:playerId" element={<RouteSuspense><PlayerPerformance /></RouteSuspense>} />
          <Route path="tryouts" element={<RouteSuspense><Tryouts /></RouteSuspense>} />
          <Route path="roster" element={<RouteSuspense><Roster /></RouteSuspense>} />
          <Route path="scouting" element={<RouteSuspense><Scouting /></RouteSuspense>} />
          <Route path="scouting/:opponent" element={<RouteSuspense><Scouting /></RouteSuspense>} />
          <Route path="matches/:matchId" element={<RouteSuspense><MatchDetails /></RouteSuspense>} />
          <Route path="settings" element={<RouteSuspense><Settings /></RouteSuspense>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
