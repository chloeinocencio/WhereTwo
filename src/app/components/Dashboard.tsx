import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { supabase } from '../../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  MapPin, Calendar as CalendarIcon, Users, Plus, LogOut,
  Trash2, Settings, UserCircle, Pencil, Save, X, Plane,
} from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import logo from '../../assets/daily.png';
import headerBg from '../../assets/header.jpg';

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp: any = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const cardVariants: any = {
  initial: { opacity: 0, y: 32, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerGrid: any = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

// ─── Destinations ─────────────────────────────────────────────────────────────
const POPULAR_DESTINATIONS = [
  { city: 'Tokyo', country: 'Japan', full: 'Tokyo, Japan' },
  { city: 'Paris', country: 'France', full: 'Paris, France' },
  { city: 'London', country: 'United Kingdom', full: 'London, United Kingdom' },
  { city: 'New York', country: 'USA', full: 'New York, USA' },
  { city: 'Barcelona', country: 'Spain', full: 'Barcelona, Spain' },
  { city: 'Rome', country: 'Italy', full: 'Rome, Italy' },
  { city: 'Dubai', country: 'UAE', full: 'Dubai, UAE' },
  { city: 'Singapore', country: 'Singapore', full: 'Singapore' },
  { city: 'Bangkok', country: 'Thailand', full: 'Bangkok, Thailand' },
  { city: 'Istanbul', country: 'Turkey', full: 'Istanbul, Turkey' },
  { city: 'Seoul', country: 'South Korea', full: 'Seoul, South Korea' },
  { city: 'Amsterdam', country: 'Netherlands', full: 'Amsterdam, Netherlands' },
  { city: 'Hong Kong', country: 'China', full: 'Hong Kong, China' },
  { city: 'Sydney', country: 'Australia', full: 'Sydney, Australia' },
  { city: 'Los Angeles', country: 'USA', full: 'Los Angeles, USA' },
  { city: 'Venice', country: 'Italy', full: 'Venice, Italy' },
  { city: 'Prague', country: 'Czech Republic', full: 'Prague, Czech Republic' },
  { city: 'Vienna', country: 'Austria', full: 'Vienna, Austria' },
  { city: 'Madrid', country: 'Spain', full: 'Madrid, Spain' },
  { city: 'Berlin', country: 'Germany', full: 'Berlin, Germany' },
  { city: 'Lisbon', country: 'Portugal', full: 'Lisbon, Portugal' },
  { city: 'San Francisco', country: 'USA', full: 'San Francisco, USA' },
  { city: 'Miami', country: 'USA', full: 'Miami, USA' },
  { city: 'Bali', country: 'Indonesia', full: 'Bali, Indonesia' },
  { city: 'Kyoto', country: 'Japan', full: 'Kyoto, Japan' },
  { city: 'Florence', country: 'Italy', full: 'Florence, Italy' },
  { city: 'Santorini', country: 'Greece', full: 'Santorini, Greece' },
  { city: 'Cancun', country: 'Mexico', full: 'Cancun, Mexico' },
  { city: 'Phuket', country: 'Thailand', full: 'Phuket, Thailand' },
  { city: 'Maldives', country: 'Maldives', full: 'Maldives' },
  { city: 'Athens', country: 'Greece', full: 'Athens, Greece' },
  { city: 'Budapest', country: 'Hungary', full: 'Budapest, Hungary' },
  { city: 'Reykjavik', country: 'Iceland', full: 'Reykjavik, Iceland' },
  { city: 'Cape Town', country: 'South Africa', full: 'Cape Town, South Africa' },
  { city: 'Rio de Janeiro', country: 'Brazil', full: 'Rio de Janeiro, Brazil' },
  { city: 'Mexico City', country: 'Mexico', full: 'Mexico City, Mexico' },
  { city: 'Osaka', country: 'Japan', full: 'Osaka, Japan' },
  { city: 'Marrakech', country: 'Morocco', full: 'Marrakech, Morocco' },
  { city: 'Dubrovnik', country: 'Croatia', full: 'Dubrovnik, Croatia' },
  { city: 'Edinburgh', country: 'Scotland', full: 'Edinburgh, Scotland' },
  { city: 'Buenos Aires', country: 'Argentina', full: 'Buenos Aires, Argentina' },
  { city: 'Taipei', country: 'Taiwan', full: 'Taipei, Taiwan' },
  { city: 'Kuala Lumpur', country: 'Malaysia', full: 'Kuala Lumpur, Malaysia' },
  { city: 'Copenhagen', country: 'Denmark', full: 'Copenhagen, Denmark' },
  { city: 'Stockholm', country: 'Sweden', full: 'Stockholm, Sweden' },
  { city: 'Zurich', country: 'Switzerland', full: 'Zurich, Switzerland' },
  { city: 'Vancouver', country: 'Canada', full: 'Vancouver, Canada' },
  { city: 'Mumbai', country: 'India', full: 'Mumbai, India' },
  { city: 'Nairobi', country: 'Kenya', full: 'Nairobi, Kenya' },
];

const NEIGHBORHOODS: Record<string, string[]> = {
  'Tokyo': ['Shibuya', 'Shinjuku', 'Asakusa', 'Ginza', 'Roppongi', 'Akihabara', 'Harajuku'],
  'Paris': ['Le Marais', 'Latin Quarter', 'Montmartre', 'Saint-Germain', 'Champs-Élysées'],
  'London': ['Soho', 'Covent Garden', 'Westminster', 'Camden', 'Shoreditch', 'Kensington'],
  'New York': ['Manhattan', 'Brooklyn', 'Greenwich Village', 'SoHo', 'Upper East Side'],
  'Barcelona': ['Gothic Quarter', 'El Born', 'Eixample', 'Gràcia', 'Barceloneta'],
  'Rome': ['Trastevere', 'Centro Storico', 'Monti', 'Prati', 'Testaccio'],
  'Amsterdam': ['Jordaan', 'De Pijp', 'Canal Ring', 'Museum Quarter'],
  'Berlin': ['Mitte', 'Kreuzberg', 'Friedrichshain', 'Prenzlauer Berg', 'Charlottenburg'],
};

interface DashboardProps {
  session: any;
  onLogout: () => void;
  onViewItinerary: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Dashboard({ session, onLogout, onViewItinerary }: DashboardProps) {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  // Calendar DateRange may have an optional 'to' property; relax typing to avoid incompatibility
  const [dateRange, setDateRange] = useState<any>({ from: undefined, to: undefined });
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [newItinerary, setNewItinerary] = useState({ location: '', base: '', days: '3' });
  const [locationSuggestions, setLocationSuggestions] = useState<{ city: string; country: string; full: string }[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSearching, setLocationSearching] = useState(false);
  const [baseSuggestions, setBaseSuggestions] = useState<string[]>([]);
  const [showBaseSuggestions, setShowBaseSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userName = session.user.user_metadata?.username || 'user';

  // Re-fetch itineraries when component mounts or when session changes
  useEffect(() => { fetchItineraries(); }, [session]);

  const fetchItineraries = async () => {
    try {
      // prefer the latest session from the supabase client to avoid using a stale token
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      const token = latestSession?.access_token || session?.access_token;

      if (!token) {
        console.error('fetchItineraries: no access token available. Session:', session);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (response.ok) {
        const sorted = (data.itineraries || []).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItineraries(sorted);
      } else {
        if (response.status === 401) {
          console.error('fetchItineraries: unauthorized (401). Token:', token, 'response:', data);
        } else {
          console.error('fetchItineraries failed:', data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      // Show popular destinations when query is too short
      setLocationSuggestions(POPULAR_DESTINATIONS.slice(0, 8));
      setLocationSearching(false);
      return;
    }
    setLocationSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&featuretype=city`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const results = data
        .filter((r: any) => r.type === 'city' || r.type === 'town' || r.type === 'village' || r.type === 'administrative' || r.addresstype === 'city' || r.addresstype === 'town')
        .map((r: any) => {
          const city = r.name || r.display_name.split(',')[0].trim();
          const country = r.address?.country || r.display_name.split(',').slice(-1)[0].trim();
          const state = r.address?.state;
          const full = state && state !== city ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
          return { city, country, full };
        })
        .filter((r: any, i: number, arr: any[]) => arr.findIndex(x => x.full === r.full) === i); // dedupe
      setLocationSuggestions(results.length > 0 ? results : POPULAR_DESTINATIONS.filter(d =>
        d.full.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5));
    } catch {
      // Fallback to static list on error
      setLocationSuggestions(POPULAR_DESTINATIONS.filter(d =>
        d.full.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5));
    } finally {
      setLocationSearching(false);
    }
  }, []);

  const handleLocationChange = (value: string) => {
    setNewItinerary({ ...newItinerary, location: value });
    setShowLocationSuggestions(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.length === 0) {
      setLocationSuggestions(POPULAR_DESTINATIONS.slice(0, 8));
      return;
    }
    searchDebounceRef.current = setTimeout(() => searchLocations(value), 300);
  };

  const handleBaseChange = (value: string) => {
    setNewItinerary({ ...newItinerary, base: value });
    if (value.length > 0 && newItinerary.location) {
      const city = newItinerary.location.split(',')[0].trim();
      const suggestions = (NEIGHBORHOODS[city] || [])
        .filter(n => n.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setBaseSuggestions(suggestions);
      setShowBaseSuggestions(suggestions.length > 0);
    } else {
      setShowBaseSuggestions(false);
    }
  };

  const handleCreateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange.from || !dateRange.to) { alert('Please select your travel dates'); return; }
    if (isCreating) return;
    setIsCreating(true);
    const title = `Trip to ${newItinerary.location.split(',')[0]}`;
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');
    try {
      // prefer the latest session from the supabase client to avoid using a stale token
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      const token = latestSession?.access_token || session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ location: newItinerary.location, base: newItinerary.base, title, area: '', days: days.toString(), startDate, endDate, interests: [], travelStyle: 'balanced', pace: 'moderate' }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${data.itinerary.id}/generate`,
          { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
        );
        setCreateDialogOpen(false);
        setNewItinerary({ location: '', base: '', days: '3' });
        setDateRange({ from: undefined, to: undefined });
        fetchItineraries();
      } else {
        // More explicit handling for authorization failures to help debugging
        if (response.status === 401) {
          console.error('Itinerary creation returned 401 Unauthorized. Access token:', session?.access_token);
          alert('Unauthorized: your login session may have expired. Please sign out and sign in again.');
        } else {
          alert(data.error || 'Failed to create itinerary');
        }
      }
    } catch (error) {
      console.error('Create itinerary exception:', error, 'access_token:', session?.access_token);
      alert('Failed to create itinerary. Please try again. If this persists, check the browser console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteItinerary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this itinerary?')) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${id}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (response.ok) fetchItineraries();
    } catch (error) { console.error(error); }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL itineraries? This cannot be undone.')) return;
    await Promise.all(itineraries.map(it =>
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${it.id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
    ));
    fetchItineraries();
  };

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername === userName) { setEditingUsername(false); return; }
    setSavingChanges(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/username`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ username: newUsername }) }
      );
      const data = await response.json();
      if (response.ok) { session.user.user_metadata.username = newUsername; setEditingUsername(false); alert('Username updated!'); }
      else alert(data.error || 'Failed to update username');
    } finally { setSavingChanges(false); }
  };

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === session.user.email) { setEditingEmail(false); return; }
    setSavingChanges(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/email`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ email: newEmail }) }
      );
      const data = await response.json();
      if (response.ok) { setEditingEmail(false); alert('Email update initiated! Check both inboxes.'); }
      else alert(data.error || 'Failed to update email');
    } finally { setSavingChanges(false); }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to permanently delete your account:');
    if (confirmation !== 'DELETE') return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (response.ok) { alert('Your account has been deleted.'); onLogout(); }
    } catch (error) { alert('Failed to delete account'); }
  };

  return (
    <div className="size-full flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative shrink-0 overflow-hidden">
        <img src={headerBg} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_42%] scale-105 blur-[2px]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <img src={logo} alt="WhereTwo" className="h-14 w-auto" />
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm transition-all duration-200">
                  <UserCircle className="w-4 h-4 mr-2" />
                  @{userName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">@{userName}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto px-6 py-6">

          {/* Top bar */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Itineraries</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Plan your next adventure</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {itineraries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="text-destructive hover:text-destructive hover:bg-destructive/8 border-destructive/25 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              )}

              {/* Create dialog */}
              <Dialog open={createDialogOpen} onOpenChange={(open) => {
                if (!isCreating) {
                  setCreateDialogOpen(open);
                  if (!open) { setNewItinerary({ location: '', base: '', days: '3' }); setDateRange({ from: undefined, to: undefined }); }
                }
              }}>
                {itineraries.length > 0 && (
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none">
                      <Plus className="w-4 h-4 mr-2" />New Itinerary
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Plan Your Trip</DialogTitle>
                    <DialogDescription>Tell us where you're going and when.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateItinerary} className="space-y-5">
                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Where are you going?</Label>
                      <div className="relative">
                        <Input
                          ref={locationInputRef}
                          value={newItinerary.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          onFocus={() => {
                            if (!newItinerary.location) setLocationSuggestions(POPULAR_DESTINATIONS.slice(0, 8));
                            setShowLocationSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                          required disabled={isCreating}
                          placeholder="Type any city…"
                          className="h-11"
                        />
                        <AnimatePresence>
                          {showLocationSuggestions && (locationSuggestions.length > 0 || locationSearching) && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto"
                            >
                              {locationSearching ? (
                                <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-r-transparent" />
                                  Searching…
                                </div>
                              ) : (
                                locationSuggestions.map((dest, i) => (
                                  <button key={i} type="button"
                                    onClick={() => { setNewItinerary({ ...newItinerary, location: dest.full }); setShowLocationSuggestions(false); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
                                  >
                                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                      <div className="font-medium text-slate-900 text-sm">{dest.city}</div>
                                      <div className="text-xs text-slate-500">{dest.country}</div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-muted-foreground">You can type any city in the world</p>
                    </div>

                    {/* Base */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Where are you staying?</Label>
                      <div className="relative">
                        <Input
                          ref={baseInputRef}
                          value={newItinerary.base}
                          onChange={(e) => handleBaseChange(e.target.value)}
                          onFocus={() => newItinerary.base && setShowBaseSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBaseSuggestions(false), 200)}
                          required disabled={isCreating}
                          placeholder="Neighborhood or hotel area"
                          className="h-11"
                        />
                        <AnimatePresence>
                          {showBaseSuggestions && baseSuggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto"
                            >
                              {baseSuggestions.map((n, i) => (
                                <button key={i} type="button"
                                  onClick={() => { setNewItinerary({ ...newItinerary, base: n }); setShowBaseSuggestions(false); }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-900 text-sm border-b border-slate-100 last:border-0 transition-colors"
                                >{n}</button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-muted-foreground">Helps us plan activities nearby</p>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">When are you traveling?</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" disabled={isCreating}
                            className={`w-full justify-start text-left font-normal h-11 ${!dateRange.from && 'text-muted-foreground'}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>{format(dateRange.from, 'LLL dd, y')} – {format(dateRange.to, 'LLL dd, y')}
                                  <span className="ml-2 text-xs text-muted-foreground">({differenceInDays(dateRange.to, dateRange.from) + 1} days)</span>
                                </>
                              ) : format(dateRange.from, 'LLL dd, y')
                            ) : <span>Pick your travel dates</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar initialFocus mode="range" defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={1}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button type="submit" className="w-full h-11 font-semibold" disabled={isCreating}>
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          Our AI is building your trip…
                        </span>
                      ) : 'Generate Itinerary'}
                    </Button>
                  </form>
                  {isCreating && (
                    <p className="text-center text-xs text-muted-foreground mt-2">This may take up to 30 seconds</p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* ── Card grid ───────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">Loading your trips…</p>
            </div>
          ) : itineraries.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-24 px-4 text-center"
              variants={fadeUp} initial="initial" animate="animate"
            >
              {/* decorative icon removed */}
              <h3 className="text-xl font-bold text-foreground mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Start planning your next adventure — create your first AI-powered itinerary!</p>
              <Button onClick={() => setCreateDialogOpen(true)} className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />Create Your First Trip
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerGrid} initial="initial" animate="animate"
            >
              {itineraries.map((itinerary) => (
                <motion.div
                  key={itinerary.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="cursor-pointer group"
                  onClick={() => onViewItinerary(itinerary.id)}
                >
                  <Card className="h-full overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 bg-white">
                    {/* Accent bar */}
                    <div className="h-1 w-full bg-primary" />

                    <div className="p-5">
                      {/* Title row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground leading-tight truncate pr-2 group-hover:text-primary transition-colors duration-200">
                            {itinerary.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium truncate">{itinerary.location}</span>
                            {itinerary.area && <span className="text-muted-foreground/60">· {itinerary.area}</span>}
                          </div>
                          {itinerary.base && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 inline-block" />
                              Staying in {itinerary.base}
                            </p>
                          )}
                        </div>
                        {itinerary.ownerId === session.user.id && (
                          <button
                            onClick={(e) => handleDeleteItinerary(itinerary.id, e)}
                            className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 p-1.5 rounded-lg transition-all duration-200 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border/50 my-3" />

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-foreground/65">
                          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                          {itinerary.startDate && itinerary.endDate ? (
                            <span className="font-medium text-xs">
                              {format(new Date(itinerary.startDate), 'MMM d')} – {format(new Date(itinerary.endDate), 'MMM d')}
                              <span className="text-muted-foreground ml-1">· {itinerary.days}d</span>
                            </span>
                          ) : (
                            <span className="font-medium text-xs">{itinerary.days} days</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground/65">
                          <Users className="w-3.5 h-3.5 text-secondary" />
                          <span className="font-medium text-xs">{itinerary.collaborators.length + 1}</span>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="mt-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          itinerary.ownerId === session.user.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/10 text-secondary'
                        }`}>
                          {itinerary.ownerId === session.user.id ? 'Owner' : 'Collaborator'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Settings dialog ──────────────────────────────────────────────────── */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>Manage your account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Username */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</Label>
                {editingUsername ? (
                  <div className="flex gap-2 mt-1.5">
                    <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="wheretwo-user-0" disabled={savingChanges} className="h-10" />
                    <Button size="icon" variant="ghost" onClick={handleSaveUsername} disabled={savingChanges} className="h-10 w-10"><Save className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingUsername(false); setNewUsername(''); }} disabled={savingChanges} className="h-10 w-10"><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-base font-semibold">@{userName}</p>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingUsername(true); setNewUsername(userName); }} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
              {/* Email */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                {editingEmail ? (
                  <div className="flex gap-2 mt-1.5">
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" disabled={savingChanges} className="h-10" />
                    <Button size="icon" variant="ghost" onClick={handleSaveEmail} disabled={savingChanges} className="h-10 w-10"><Save className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingEmail(false); setNewEmail(''); }} disabled={savingChanges} className="h-10 w-10"><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-base font-semibold">{session.user.email}</p>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingEmail(true); setNewEmail(session.user.email || ''); }} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            </div>
            {/* Danger zone */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground mb-3">Danger Zone</h3>
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                <h4 className="text-sm font-semibold text-destructive mb-1">Delete Account</h4>
                <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all data. Cannot be undone.</p>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Account
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
