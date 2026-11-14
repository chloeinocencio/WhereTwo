import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, API_BASE, authHeaders } from '../../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  MapPin, Calendar as CalendarIcon, Plus, LogOut, ChevronRight,
  Trash2, Settings, UserCircle, Pencil, Save, X,
} from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { format, differenceInDays, parseISO } from 'date-fns';
import logo from '../../assets/logo.png';
import headerBg from '../../assets/header.jpg';
import {
  INK, SLATE, MIST, PAPER, TODAY, getActivityKind, destinationColors, splitPlace, tripStatus, sortTrips,
  type TripStatus,
} from '../../lib/tripVisuals';

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

// Keys match the server's travelStyle prompt options (generateOptimalPlan in the edge function).
const BUDGET_OPTIONS = [
  { id: 'budget', label: 'Budget', hint: 'Under $100/day' },
  { id: 'balanced', label: 'Mid-range', hint: '$100–300/day' },
  { id: 'luxury', label: 'Luxury', hint: '$300+/day' },
] as const;
type Budget = typeof BUDGET_OPTIONS[number]['id'];

// ─── Trip list pieces ─────────────────────────────────────────────────────────

function statusText(status: TripStatus) {
  switch (status.kind) {
    case 'underway': return `Day ${status.day} of ${status.days}`;
    case 'upcoming': return status.daysAway === 1 ? 'Tomorrow' : `In ${status.daysAway} days`;
    case 'past': return 'Past trip';
    default: return 'Dates not set';
  }
}

function tripDates(trip: any) {
  if (!trip.startDate || !trip.endDate) return `${trip.days} day${trip.days === 1 ? '' : 's'}`;
  return `${format(parseISO(trip.startDate), 'MMM d')} – ${format(parseISO(trip.endDate), 'MMM d')}`;
}

function travelers(trip: any): string[] {
  return [trip.ownerUsername, ...(trip.collaborators || []).map((c: any) => c.username)].filter(Boolean);
}

function Avatars({ names, ring, fill = '#fff' }: { names: string[]; ring: string; fill?: string }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, 4).map((name) => (
        <span
          key={name}
          title={`@${name}`}
          className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ring-2"
          style={{ color: INK, background: fill, ['--tw-ring-color' as any]: ring }}
        >
          {name[0]?.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

/** A row of the trip's stops as colored markers, so each card hints at what the plan holds. */
function PlanPreview({ trip, max = 12 }: { trip: any; max?: number }) {
  const stops = (trip.plan || []).flatMap((d: any) => d.activities || []);
  if (stops.length === 0) {
    return <p className="text-sm" style={{ color: SLATE }}>No plan yet. Open the trip to make one.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={`${stops.length} stops planned`}>
      {stops.slice(0, max).map((stop: any, i: number) => {
        const kind = getActivityKind(stop.type);
        const Icon = kind.icon;
        return (
          <span
            key={stop.id || i}
            title={stop.title}
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{ background: `${kind.color}1F`, color: kind.color }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.3} />
          </span>
        );
      })}
      {stops.length > max && (
        <span className="ml-1 text-sm font-medium" style={{ color: SLATE }}>+{stops.length - max}</span>
      )}
    </div>
  );
}

function StatusChip({ status, onDark }: { status: TripStatus; onDark?: boolean }) {
  const underway = status.kind === 'underway';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={underway
        ? { background: TODAY, color: '#3A2300' }
        : onDark ? { background: 'rgba(255,255,255,0.18)', color: '#fff' } : { background: '#EEF2FA', color: INK }}
    >
      {underway && <span className="h-1.5 w-1.5 rounded-full bg-[#3A2300]" />}
      {statusText(status)}
    </span>
  );
}

/** The trip that's happening now, or the next one coming up, shown large at the top. */
function FeaturedTrip({ trip, onOpen }: { trip: any; onOpen: () => void }) {
  const [deep, light] = destinationColors(trip.location);
  const { city, region } = splitPlace(trip.location);
  const status = tripStatus(trip);
  const todayStops = status.kind === 'underway' ? (trip.plan?.[status.day - 1]?.activities || []) : [];

  return (
    <button
      onClick={onOpen}
      className="group grid w-full overflow-hidden rounded-[28px] text-left shadow-[0_18px_40px_-24px_rgba(14,31,77,0.55)] ring-1 ring-black/5 md:grid-cols-[1.15fr_1fr] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
    >
      {/* Destination panel */}
      <div
        className="relative flex min-h-[220px] flex-col justify-between p-6 sm:p-8 text-white"
        style={{ background: `linear-gradient(140deg, ${deep} 0%, ${light} 100%)` }}
      >
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={status} onDark />
          <Avatars names={travelers(trip)} ring={deep} />
        </div>
        <div>
          {status.kind === 'upcoming' && (
            <p className="font-display text-[64px] sm:text-[84px] font-extrabold leading-[0.9] tracking-[-0.04em] text-white/95">
              {status.daysAway}
              <span className="ml-2 align-top text-lg font-semibold tracking-normal text-white/80">
                day{status.daysAway === 1 ? '' : 's'} to go
              </span>
            </p>
          )}
          <h3 className="font-display mt-2 text-[40px] sm:text-[52px] font-bold leading-[0.95] tracking-[-0.03em] text-balance">
            {city}
          </h3>
          {region && <p className="mt-1.5 text-[15px] text-white/80">{region}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-5 bg-white p-6 sm:p-8">
        <div>
          <p className="font-display text-xl font-semibold leading-snug" style={{ color: INK }}>{trip.title}</p>
          <p className="mt-1 text-[15px]" style={{ color: SLATE }}>
            {tripDates(trip)}{trip.base ? `, staying in ${trip.base}` : ''}
          </p>
        </div>

        {todayStops.length > 0 ? (
          <div>
            <p className="mb-2.5 text-sm font-semibold" style={{ color: INK }}>Today</p>
            <ul className="space-y-2">
              {todayStops.slice(0, 3).map((stop: any, i: number) => {
                const kind = getActivityKind(stop.type);
                const Icon = kind.icon;
                return (
                  <li key={stop.id || i} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: `${kind.color}1F`, color: kind.color }}>
                      <Icon className="h-4 w-4" strokeWidth={2.3} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium" style={{ color: INK }}>
                        {stop.title.replace(/\s*\([^)]*\)\s*$/, '')}
                      </span>
                      <span className="block text-xs" style={{ color: SLATE }}>{stop.timeSlot}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <PlanPreview trip={trip} />
        )}

        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:underline">
          {status.kind === 'underway' ? "Open today's plan" : 'Open trip'}
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function TripCard({ trip, canDelete, onOpen, onDelete }: { trip: any; canDelete: boolean; onOpen: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const status = tripStatus(trip);
  const past = status.kind === 'past';
  const [deep, light] = past ? ['#5B6476', '#A9B1C2'] : destinationColors(trip.location);
  const { city, region } = splitPlace(trip.location);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-[#DDE4F3] transition-shadow hover:shadow-[0_14px_30px_-20px_rgba(14,31,77,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
    >
      <div className="relative h-32 p-5 text-white" style={{ background: `linear-gradient(140deg, ${deep} 0%, ${light} 100%)` }}>
        <div className="flex items-start justify-between gap-2">
          <StatusChip status={status} onDark />
          {canDelete && (
            <button
              onClick={onDelete}
              className="rounded-full p-1.5 text-white/70 opacity-0 transition-opacity hover:bg-white/15 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Delete ${trip.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="font-display truncate text-[30px] font-bold leading-none tracking-[-0.025em]">{city}</h3>
          {region && <p className="mt-1 truncate text-sm text-white/80">{region}</p>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold" style={{ color: INK }}>{trip.title}</p>
            <p className="mt-0.5 text-sm" style={{ color: SLATE }}>{tripDates(trip)}</p>
          </div>
          <Avatars names={travelers(trip)} ring="#fff" fill="#E6ECF8" />
        </div>
        <PlanPreview trip={trip} max={7} />
      </div>
    </div>
  );
}

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
  const [budget, setBudget] = useState<Budget>('balanced');
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
        `${API_BASE}/itineraries`,
        { headers: authHeaders(token) }
      );

      const data = await response.json();
      if (response.ok) {
        const sorted = (data.itineraries || []).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItineraries(sorted);
      } else {
        if (response.status === 401) {
          console.error('fetchItineraries: unauthorized (401):', data);
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
        `${API_BASE}/itineraries`,
        {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ location: newItinerary.location, base: newItinerary.base, title, area: '', days: days.toString(), startDate, endDate, interests: [], travelStyle: budget, pace: 'moderate' }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        await fetch(
          `${API_BASE}/itineraries/${data.itinerary.id}/generate`,
          { method: 'POST', headers: authHeaders(token) }
        );
        setCreateDialogOpen(false);
        setNewItinerary({ location: '', base: '', days: '3' });
        setDateRange({ from: undefined, to: undefined });
        setBudget('balanced');
        fetchItineraries();
      } else {
        // More explicit handling for authorization failures to help debugging
        if (response.status === 401) {
          console.error('Itinerary creation returned 401 Unauthorized');
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
        `${API_BASE}/itineraries/${id}`,
        { method: 'DELETE', headers: authHeaders(session.access_token) }
      );
      if (response.ok) fetchItineraries();
    } catch (error) { console.error(error); }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL itineraries? This cannot be undone.')) return;
    await Promise.all(itineraries.map(it =>
      fetch(`${API_BASE}/itineraries/${it.id}`, {
        method: 'DELETE', headers: authHeaders(session.access_token)
      })
    ));
    fetchItineraries();
  };

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername === userName) { setEditingUsername(false); return; }
    setSavingChanges(true);
    try {
      const response = await fetch(
        `${API_BASE}/account/username`,
        { method: 'PUT', headers: authHeaders(session.access_token), body: JSON.stringify({ username: newUsername }) }
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
        `${API_BASE}/account/email`,
        { method: 'PUT', headers: authHeaders(session.access_token), body: JSON.stringify({ email: newEmail }) }
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
        `${API_BASE}/account`,
        { method: 'DELETE', headers: authHeaders(session.access_token) }
      );
      if (response.ok) { alert('Your account has been deleted.'); onLogout(); }
    } catch (error) { alert('Failed to delete account'); }
  };

  const sorted = sortTrips(itineraries);
  const featured = sorted.find((t) => ['underway', 'upcoming'].includes(tripStatus(t).kind));
  const rest = sorted.filter((t) => t !== featured);
  const current = rest.filter((t) => tripStatus(t).kind !== 'past');
  const past = rest.filter((t) => tripStatus(t).kind === 'past');
  const underwayCount = sorted.filter((t) => tripStatus(t).kind === 'underway').length;
  const upcomingCount = sorted.filter((t) => tripStatus(t).kind === 'upcoming').length;
  const summary = [
    underwayCount ? `${underwayCount} trip${underwayCount === 1 ? '' : 's'} happening now` : '',
    upcomingCount ? `${upcomingCount} coming up` : '',
  ].filter(Boolean).join(' and ');

  return (
    <div className="size-full overflow-auto" style={{ background: PAPER }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden text-white" style={{ background: INK }}>
        <img src={headerBg} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1F4D]/90 via-[#0E1F4D]/50 to-[#0E1F4D]/20" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-5 pb-9">
          <div className="flex items-center justify-between">
            <img src={logo} alt="WhereTwo" className="h-12 w-auto" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
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
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="font-display mt-10 max-w-2xl text-[36px] sm:text-[52px] font-bold leading-[1] tracking-[-0.03em] text-balance">
            Where to next, {userName}?
          </h1>
          {!loading && (
            <p className="mt-3 text-[17px] text-white/80">
              {summary || (itineraries.length ? 'All your trips are behind you. Time to plan another.' : 'Plan your first trip together.')}
            </p>
          )}
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

          {/* Top bar */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div>
              <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]" style={{ color: INK }}>Your trips</h2>
            </div>
            <div className="flex gap-2 shrink-0">
              {itineraries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="text-destructive hover:text-destructive hover:bg-destructive/8 border-destructive/25 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete all</span>
                </Button>
              )}

              {/* Create dialog */}
              <Dialog open={createDialogOpen} onOpenChange={(open) => {
                if (!isCreating) {
                  setCreateDialogOpen(open);
                  if (!open) { setNewItinerary({ location: '', base: '', days: '3' }); setDateRange({ from: undefined, to: undefined }); setBudget('balanced'); }
                }
              }}>
                {itineraries.length > 0 && (
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none">
                      <Plus className="w-4 h-4 mr-2" />New trip
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

                    {/* Budget */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">What's your daily budget?</Label>
                      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Daily budget">
                        {BUDGET_OPTIONS.map((option) => {
                          const selected = budget === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              disabled={isCreating}
                              onClick={() => setBudget(option.id)}
                              className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                                selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{option.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{option.hint}</div>
                            </button>
                          );
                        })}
                      </div>
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

          {/* ── Trips ───────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">Loading your trips…</p>
            </div>
          ) : itineraries.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed py-20 px-6 text-center"
              style={{ borderColor: MIST }}
              variants={fadeUp} initial="initial" animate="animate"
            >
              <h3 className="font-display text-2xl font-bold" style={{ color: INK }}>No trips yet</h3>
              <p className="mt-2 mb-6 max-w-sm text-[15px]" style={{ color: SLATE }}>
                Pick a city and your dates, and WhereTwo plans each day around where you're staying.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />Plan a trip
              </Button>
            </motion.div>
          ) : (
            <motion.div className="space-y-10" variants={staggerGrid} initial="initial" animate="animate">
              {featured && (
                <motion.div variants={cardVariants}>
                  <FeaturedTrip trip={featured} onOpen={() => onViewItinerary(featured.id)} />
                </motion.div>
              )}

              {current.length > 0 && (
                <section>
                  {featured && <h3 className="mb-4 font-display text-lg font-semibold" style={{ color: INK }}>More trips</h3>}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {current.map((trip) => (
                      <motion.div key={trip.id} variants={cardVariants}>
                        <TripCard
                          trip={trip}
                          canDelete={trip.ownerId === session.user.id}
                          onOpen={() => onViewItinerary(trip.id)}
                          onDelete={(e) => handleDeleteItinerary(trip.id, e)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h3 className="mb-4 font-display text-lg font-semibold" style={{ color: INK }}>Past trips</h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {past.map((trip) => (
                      <motion.div key={trip.id} variants={cardVariants}>
                        <TripCard
                          trip={trip}
                          canDelete={trip.ownerId === session.user.id}
                          onOpen={() => onViewItinerary(trip.id)}
                          onDelete={(e) => handleDeleteItinerary(trip.id, e)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
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
