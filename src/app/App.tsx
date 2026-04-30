import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';
import { ItineraryView } from './components/ItineraryView';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'itinerary'>('dashboard');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false);
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