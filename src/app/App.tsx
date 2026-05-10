import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';
import { ItineraryView } from './components/ItineraryView';
import logo from '../assets/daily.png';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'itinerary'>('dashboard');
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false);
  };

  const handleLogin = (newSession: any) => setSession(newSession);

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
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          <img src={logo} alt="WhereTwo" className="w-48 h-auto -my-6" style={{ filter: 'invert(1)' }} />
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="size-full bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            className="size-full"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } as any}
          >
            <Dashboard
              session={session}
              onLogout={handleLogout}
              onViewItinerary={handleViewItinerary}
            />
          </motion.div>
        ) : (
          <motion.div
            key="itinerary"
            className="size-full"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } as any}
          >
            <ItineraryView
              session={session}
              itineraryId={selectedItineraryId!}
              onBack={handleBackToDashboard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
