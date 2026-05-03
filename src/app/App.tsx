import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';
import { ItineraryView } from './components/ItineraryView';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import headerImg from '../assets/header.jpg';
import logoImg from '../assets/pin-logo.png';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'itinerary'>('dashboard');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setSession(session);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setResetError(error.message); return; }
      setResetDone(true);
      setTimeout(() => {
        setRecoveryMode(false);
        setNewPassword('');
        setConfirmPassword('');
        setResetDone(false);
      }, 2000);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = (newSession: any) => {
    setSession(newSession);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentView('dashboard');
    setSelectedItineraryId(null);
  };

  const handleViewItinerary = (id: string) => {
    setSelectedItineraryId(id);
    setCurrentView('itinerary');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedItineraryId(null);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading</div>
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col overflow-hidden"
        style={{ backgroundImage: `url(${headerImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
        <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
          <div className="flex flex-col items-center w-full max-w-[430px]">
            <img src={logoImg} alt="WhereTwo" className="w-56 h-56 object-contain" />
            <div className="w-full rounded-[2rem] bg-white/12 border border-white/20 shadow-2xl backdrop-blur-2xl px-8 py-9">
              {resetDone ? (
                <>
                  <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-2">Password updated</h1>
                  <p className="text-sm text-white/50 text-center">Signing you in…</p>
                </>
              ) : (
                <>
                  <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-6">Set new password</h1>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="New password"
                      className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                      autoFocus
                    />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                    />
                    {resetError && (
                      <div className="rounded-2xl border border-red-400/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">{resetError}</div>
                    )}
                    <Button
                      type="submit"
                      disabled={resetLoading}
                      className="h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-lg hover:bg-white/90 transition-all"
                    >
                      {resetLoading ? 'Updating…' : 'Update password'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>
        <footer className="relative z-10 pb-5 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Chloe Inocencio. All Rights Reserved.
        </footer>
      </div>
    );
  }

  if (!session) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="size-full bg-background">
      {currentView === 'dashboard' ? (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          onViewItinerary={handleViewItinerary}
        />
      ) : (
        <ItineraryView
          session={session}
          itineraryId={selectedItineraryId!}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}
