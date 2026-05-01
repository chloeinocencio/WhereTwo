import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import logoImg from '../../assets/daily.png';
import headerImg from '../../assets/header.jpg';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MapPin, Calendar as CalendarIcon, Users, Plus, LogOut, Trash2, Settings, User, UserCircle, Pencil, Save, X, ArrowLeft } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { format, differenceInDays, addDays } from 'date-fns';

const ACTIVITY_INTERESTS = [
  { id: 'culture', label: 'Culture & Heritage', icon: '🏛️' },
  { id: 'culinary', label: 'Culinary Experiences', icon: '🍜' },
  { id: 'outdoor', label: 'Outdoor & Adventure', icon: '🏔️' },
  { id: 'arts', label: 'Arts & Entertainment', icon: '🎭' },
  { id: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
  { id: 'wellness', label: 'Wellness & Relaxation', icon: '🧘' },
  { id: 'nightlife', label: 'Nightlife & Social', icon: '🌙' },
  { id: 'photography', label: 'Photography & Scenic', icon: '📸' },
];

const PACE_OPTIONS = [
  {
    id: 'leisurely',
    label: 'Leisurely',
    description: '2–3 key experiences per day with time to truly absorb each moment',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: '4–5 curated activities blending exploration with relaxed downtime',
  },
  {
    id: 'immersive',
    label: 'Immersive',
    description: '6+ experiences per day, maximizing every hour of your trip',
  },
];

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
  { city: 'Chicago', country: 'USA', full: 'Chicago, USA' },
  { city: 'Las Vegas', country: 'USA', full: 'Las Vegas, USA' },
  { city: 'Boston', country: 'USA', full: 'Boston, USA' },
  { city: 'Seattle', country: 'USA', full: 'Seattle, USA' },
  { city: 'Melbourne', country: 'Australia', full: 'Melbourne, Australia' },
  { city: 'Toronto', country: 'Canada', full: 'Toronto, Canada' },
  { city: 'Vancouver', country: 'Canada', full: 'Vancouver, Canada' },
  { city: 'Montreal', country: 'Canada', full: 'Montreal, Canada' },
  { city: 'Osaka', country: 'Japan', full: 'Osaka, Japan' },
  { city: 'Shanghai', country: 'China', full: 'Shanghai, China' },
  { city: 'Beijing', country: 'China', full: 'Beijing, China' },
  { city: 'Taipei', country: 'Taiwan', full: 'Taipei, Taiwan' },
  { city: 'Kuala Lumpur', country: 'Malaysia', full: 'Kuala Lumpur, Malaysia' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', full: 'Ho Chi Minh City, Vietnam' },
  { city: 'Hanoi', country: 'Vietnam', full: 'Hanoi, Vietnam' },
  { city: 'Mumbai', country: 'India', full: 'Mumbai, India' },
  { city: 'Delhi', country: 'India', full: 'Delhi, India' },
  { city: 'Jaipur', country: 'India', full: 'Jaipur, India' },
  { city: 'Cairo', country: 'Egypt', full: 'Cairo, Egypt' },
  { city: 'Marrakech', country: 'Morocco', full: 'Marrakech, Morocco' },
  { city: 'Cape Town', country: 'South Africa', full: 'Cape Town, South Africa' },
  { city: 'Rio de Janeiro', country: 'Brazil', full: 'Rio de Janeiro, Brazil' },
  { city: 'Buenos Aires', country: 'Argentina', full: 'Buenos Aires, Argentina' },
  { city: 'Lima', country: 'Peru', full: 'Lima, Peru' },
  { city: 'Mexico City', country: 'Mexico', full: 'Mexico City, Mexico' },
  { city: 'Reykjavik', country: 'Iceland', full: 'Reykjavik, Iceland' },
  { city: 'Copenhagen', country: 'Denmark', full: 'Copenhagen, Denmark' },
  { city: 'Stockholm', country: 'Sweden', full: 'Stockholm, Sweden' },
  { city: 'Oslo', country: 'Norway', full: 'Oslo, Norway' },
  { city: 'Helsinki', country: 'Finland', full: 'Helsinki, Finland' },
  { city: 'Dublin', country: 'Ireland', full: 'Dublin, Ireland' },
  { city: 'Edinburgh', country: 'Scotland', full: 'Edinburgh, Scotland' },
  { city: 'Brussels', country: 'Belgium', full: 'Brussels, Belgium' },
  { city: 'Zurich', country: 'Switzerland', full: 'Zurich, Switzerland' },
  { city: 'Geneva', country: 'Switzerland', full: 'Geneva, Switzerland' },
  { city: 'Monaco', country: 'Monaco', full: 'Monaco' },
  { city: 'Nice', country: 'France', full: 'Nice, France' },
  { city: 'Lyon', country: 'France', full: 'Lyon, France' },
  { city: 'Milan', country: 'Italy', full: 'Milan, Italy' },
  { city: 'Naples', country: 'Italy', full: 'Naples, Italy' },
  { city: 'Seville', country: 'Spain', full: 'Seville, Spain' },
  { city: 'Valencia', country: 'Spain', full: 'Valencia, Spain' },
  { city: 'Porto', country: 'Portugal', full: 'Porto, Portugal' },
  { city: 'Krakow', country: 'Poland', full: 'Krakow, Poland' },
  { city: 'Budapest', country: 'Hungary', full: 'Budapest, Hungary' },
  { city: 'Warsaw', country: 'Poland', full: 'Warsaw, Poland' },
  { city: 'Jerusalem', country: 'Israel', full: 'Jerusalem, Israel' },
  { city: 'Tel Aviv', country: 'Israel', full: 'Tel Aviv, Israel' },
  { city: 'Doha', country: 'Qatar', full: 'Doha, Qatar' },
  { city: 'Abu Dhabi', country: 'UAE', full: 'Abu Dhabi, UAE' },
];

interface DashboardProps {
  session: any;
  onLogout: () => void;
  onViewItinerary: (id: string) => void;
}

export function Dashboard({ session, onLogout, onViewItinerary }: DashboardProps) {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
    location: '',
    base: '',
    days: '3',
  });
  const [locationSuggestions, setLocationSuggestions] = useState<typeof POPULAR_DESTINATIONS>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [baseSuggestions, setBaseSuggestions] = useState<string[]>([]);
  const [showBaseSuggestions, setShowBaseSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPace, setSelectedPace] = useState<'leisurely' | 'balanced' | 'immersive'>('balanced');
  const locationInputRef = useRef<HTMLInputElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Reverse order so newest itineraries appear first
        const sorted = (data.itineraries || []).sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setItineraries(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (value: string) => {
    setNewItinerary({ ...newItinerary, location: value });

    if (value.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.full.toLowerCase().includes(value.toLowerCase()) ||
        dest.city.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    setNewItinerary({ ...newItinerary, location });
    setShowLocationSuggestions(false);
  };

  const handleBaseChange = (value: string) => {
    setNewItinerary({ ...newItinerary, base: value });

    if (value.length > 0 && newItinerary.location) {
      const locationName = newItinerary.location.split(',')[0].trim();
      const suggestions = getNeighborhoodSuggestions(locationName, value);
      setBaseSuggestions(suggestions);
      setShowBaseSuggestions(suggestions.length > 0);
    } else {
      setShowBaseSuggestions(false);
    }
  };

  const handleBaseSelect = (base: string) => {
    setNewItinerary({ ...newItinerary, base });
    setShowBaseSuggestions(false);
  };

  const getNeighborhoodSuggestions = (city: string, input: string): string[] => {
    const neighborhoods: Record<string, string[]> = {
      'Tokyo': ['Shibuya', 'Shinjuku', 'Asakusa', 'Ginza', 'Roppongi', 'Akihabara', 'Harajuku'],
      'Paris': ['Marais', 'Latin Quarter', 'Montmartre', 'Saint-Germain', 'Le Marais', 'Champs-Élysées'],
      'London': ['Soho', 'Covent Garden', 'Westminster', 'Camden', 'Shoreditch', 'Kensington'],
      'New York': ['Manhattan', 'Brooklyn', 'Times Square', 'Greenwich Village', 'SoHo', 'Upper East Side'],
      'Barcelona': ['Gothic Quarter', 'El Born', 'Eixample', 'Gràcia', 'Barceloneta'],
      'Rome': ['Trastevere', 'Centro Storico', 'Monti', 'Prati', 'Testaccio'],
      'Amsterdam': ['Jordaan', 'De Pijp', 'Canal Ring', 'Museum Quarter', 'Red Light District'],
      'Berlin': ['Mitte', 'Kreuzberg', 'Friedrichshain', 'Prenzlauer Berg', 'Charlottenburg'],
    };

    const cityNeighborhoods = neighborhoods[city] || [];
    return cityNeighborhoods.filter(n => n.toLowerCase().includes(input.toLowerCase())).slice(0, 5);
  };

  const handleCreateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateRange.from || !dateRange.to) {
      alert('Please select your travel dates');
      return;
    }

    if (isCreating) return; // Prevent duplicate submissions

    setIsCreating(true);
    const title = `Trip to ${newItinerary.location.split(',')[0]}`;

    // Calculate days from date range
    let days = parseInt(newItinerary.days);
    let startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    let endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

    if (dateRange.from && dateRange.to) {
      days = differenceInDays(dateRange.to, dateRange.from) + 1;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            location: newItinerary.location,
            base: newItinerary.base,
            title,
            area: '',
            days: days.toString(),
            startDate,
            endDate,
            interests: selectedInterests,
            travelStyle: 'balanced',
            pace: selectedPace,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await generatePlan(data.itinerary.id);
        setCreateDialogOpen(false);
        setNewItinerary({ location: '', base: '', days: '3' });
        setDateRange({ from: undefined, to: undefined });
        setCreateStep(1);
        setSelectedInterests([]);
        setSelectedPace('balanced');
        fetchItineraries();
      } else {
        alert(data.error || 'Failed to create itinerary');
      }
    } catch (error) {
      console.error('Failed to create itinerary:', error);
      alert('Failed to create itinerary. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdvanceStep = () => {
    if (!newItinerary.location) { alert('Please enter a destination'); return; }
    if (!newItinerary.base) { alert('Please enter where you\'re staying'); return; }
    if (!dateRange.from || !dateRange.to) { alert('Please select your travel dates'); return; }
    setCreateStep(2);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generatePlan = async (itineraryId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to generate plan:', error);
    }
  };

  const handleDeleteItinerary = async (itineraryId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        fetchItineraries();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete itinerary');
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      alert('Failed to delete itinerary');
    }
  };

  const handleClearAllItineraries = async () => {
    if (!confirm('Are you sure you want to delete ALL itineraries? This action cannot be undone.')) {
      return;
    }

    try {
      const deletePromises = itineraries.map(itinerary =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itinerary.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        )
      );

      await Promise.all(deletePromises);
      fetchItineraries();
    } catch (error) {
      console.error('Failed to clear itineraries:', error);
      alert('Failed to clear all itineraries');
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername === userName) {
      setEditingUsername(false);
      return;
    }

    setSavingChanges(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/username`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ username: newUsername }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        session.user.user_metadata.username = newUsername;
        setEditingUsername(false);
        alert('Username updated successfully!');
      } else {
        alert(data.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Failed to update username:', error);
      alert('Failed to update username');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === session.user.email) {
      setEditingEmail(false);
      return;
    }

    setSavingChanges(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/email`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: newEmail }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEditingEmail(false);
        alert('Email update initiated! Check both your old and new email for confirmation.');
      } else {
        alert(data.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Failed to update email:', error);
      alert('Failed to update email');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you ABSOLUTELY sure you want to delete your account? This will permanently delete all your itineraries and data. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        alert('Your account has been deleted.');
        onLogout();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
  };

  const userName = session.user.user_metadata?.username || 'user';

  return (
    <div className="size-full">
      <header
        className="relative border-b border-white/10 shadow-lg overflow-hidden"
        style={{ backgroundImage: `url(${headerImg})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <img src={logoImg} alt="WhereTwo" className="h-8 w-auto drop-shadow-md" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 border border-white/20 rounded-full px-4">
                <UserCircle className="w-5 h-5" />
                @{userName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">@{userName}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Itineraries</h2>
            <p className="text-sm text-muted-foreground mt-1">Plan your next adventure</p>
          </div>
          <div className="flex gap-2">
            {itineraries.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAllItineraries}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              if (!isCreating) {
                setCreateDialogOpen(open);
                if (!open) {
                  setNewItinerary({ location: '', base: '', days: '3' });
                  setDateRange({ from: undefined, to: undefined });
                  setCreateStep(1);
                  setSelectedInterests([]);
                  setSelectedPace('balanced');
                }
              }
            }}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                  <Plus className="w-4 h-4 mr-2" />
                  New Itinerary
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Plan Your Trip</DialogTitle>
                <DialogDescription>
                  {createStep === 1 ? 'Tell us where you\'re going and when.' : 'Personalize your experience.'}
                </DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center gap-2 -mt-1 mb-1">
                <div className={`h-1 flex-1 rounded-full ${createStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`h-1 flex-1 rounded-full ${createStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>

              <form onSubmit={handleCreateItinerary}>
                {createStep === 1 ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base">Where are you going?</Label>
                      <div className="relative">
                        <Input
                          ref={locationInputRef}
                          id="location"
                          value={newItinerary.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          onFocus={() => {
                            if (!newItinerary.location) {
                              setLocationSuggestions(POPULAR_DESTINATIONS.slice(0, 8));
                              setShowLocationSuggestions(true);
                            } else if (newItinerary.location) {
                              setShowLocationSuggestions(true);
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                          disabled={isCreating}
                          placeholder="Type any city..."
                          className="text-base"
                        />
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {locationSuggestions.map((dest, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleLocationSelect(dest.full)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-0"
                              >
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <div>
                                  <div className="font-medium text-slate-900">{dest.city}</div>
                                  <div className="text-xs text-slate-500">{dest.country}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">You can type any city in the world</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="base" className="text-base">Where are you staying?</Label>
                      <div className="relative">
                        <Input
                          ref={baseInputRef}
                          id="base"
                          value={newItinerary.base}
                          onChange={(e) => handleBaseChange(e.target.value)}
                          onFocus={() => newItinerary.base && setShowBaseSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBaseSuggestions(false), 200)}
                          disabled={isCreating}
                          placeholder="Neighborhood or hotel area"
                          className="text-base"
                        />
                        {showBaseSuggestions && baseSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                            {baseSuggestions.map((neighborhood, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleBaseSelect(neighborhood)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-900 border-b border-slate-100 last:border-0"
                              >
                                {neighborhood}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">This helps us plan activities nearby</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">When are you traveling?</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal h-11 ${
                              !dateRange.from && 'text-muted-foreground'
                            }`}
                            disabled={isCreating}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({differenceInDays(dateRange.to, dateRange.from) + 1} days)
                                  </span>
                                </>
                              ) : (
                                format(dateRange.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick your travel dates</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={1}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-slate-500">Select your check-in and check-out dates</p>
                    </div>

                    <Button type="button" className="w-full h-11 text-base" onClick={handleAdvanceStep}>
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base">What experiences interest you?</Label>
                        <p className="text-xs text-slate-500 mt-1">Select all that apply — your itinerary will be tailored accordingly.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIVITY_INTERESTS.map((interest) => {
                          const selected = selectedInterests.includes(interest.id);
                          return (
                            <button
                              key={interest.id}
                              type="button"
                              onClick={() => toggleInterest(interest.id)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                                selected
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border text-foreground hover:border-primary/40 hover:bg-muted/50'
                              }`}
                            >
                              <span className="text-base">{interest.icon}</span>
                              <span>{interest.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">How would you like to pace your days?</Label>
                      <div className="space-y-2">
                        {PACE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedPace(option.id as 'leisurely' | 'balanced' | 'immersive')}
                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                              selectedPace === option.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`font-semibold text-sm ${selectedPace === option.id ? 'text-primary' : 'text-foreground'}`}>{option.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setCreateStep(1)} className="gap-1.5" disabled={isCreating}>
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1 h-11 text-base" disabled={isCreating}>
                        {isCreating ? (
                          <>
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                            Creating your trip...
                          </>
                        ) : (
                          'Generate Itinerary'
                        )}
                      </Button>
                    </div>
                    {isCreating && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Our AI is planning your perfect trip...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take up to 30 seconds</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
          </div>

          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Account Settings</DialogTitle>
                <DialogDescription>
                  Manage your account information and preferences
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    {editingUsername ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="wheretwo-user-0"
                          disabled={savingChanges}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveUsername}
                          disabled={savingChanges}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingUsername(false);
                            setNewUsername('');
                          }}
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-semibold">@{userName}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingUsername(true);
                            setNewUsername(userName);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    {editingEmail ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={savingChanges}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveEmail}
                          disabled={savingChanges}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingEmail(false);
                            setNewEmail('');
                          }}
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-semibold">{session.user.email}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingEmail(true);
                            setNewEmail(session.user.email || '');
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-destructive mb-2">Delete Account</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading your trips...</p>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-6">Start planning your next adventure by creating your first itinerary!</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Trip
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 hover:border-primary/20" onClick={() => onViewItinerary(itinerary.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-foreground">{itinerary.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-2 text-base">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{itinerary.location}</span>
                        {itinerary.area && ` - ${itinerary.area}`}
                      </CardDescription>
                      {itinerary.base && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Staying in {itinerary.base}
                        </p>
                      )}
                    </div>
                    {itinerary.ownerId === session.user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-2"
                        onClick={(e) => handleDeleteItinerary(itinerary.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <div className="bg-primary/10 p-1.5 rounded-md">
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {itinerary.startDate && itinerary.endDate ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">{itinerary.days} days</span>
                        </div>
                      ) : (
                        <span className="font-medium">{itinerary.days} days</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <div className="bg-secondary/10 p-1.5 rounded-md">
                        <Users className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <span className="font-medium">{itinerary.collaborators.length + 1}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      itinerary.ownerId === session.user.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {itinerary.ownerId === session.user.id ? 'Owner' : 'Collaborator'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}