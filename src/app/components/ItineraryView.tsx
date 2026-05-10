import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectId } from '../../../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import {
  ArrowLeft, MapPin, Calendar, Users, UserPlus,
  Edit2, Check, X, Clock, DollarSign, Navigation,
  Info, ChevronRight, AlertTriangle, RefreshCw, Plus, Trash2, Plane, GripVertical,
  ExternalLink, Map as MapIcon,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { WeatherIcon } from './WeatherIcon';
import logo from '../../assets/daily.png';
import headerBg from '../../assets/header.jpg';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ItineraryViewProps {
  session: any;
  itineraryId: string;
  onBack: () => void;
}

// ─── Airlines (IATA + name for autocomplete) ──────────────────────────────────
const AIRLINES = [
  { iata: 'AA', name: 'American Airlines' }, { iata: 'UA', name: 'United Airlines' },
  { iata: 'DL', name: 'Delta Air Lines' }, { iata: 'WN', name: 'Southwest Airlines' },
  { iata: 'BA', name: 'British Airways' }, { iata: 'LH', name: 'Lufthansa' },
  { iata: 'AF', name: 'Air France' }, { iata: 'KL', name: 'KLM Royal Dutch Airlines' },
  { iata: 'EK', name: 'Emirates' }, { iata: 'QR', name: 'Qatar Airways' },
  { iata: 'EY', name: 'Etihad Airways' }, { iata: 'SQ', name: 'Singapore Airlines' },
  { iata: 'CX', name: 'Cathay Pacific' }, { iata: 'JL', name: 'Japan Airlines' },
  { iata: 'NH', name: 'All Nippon Airways' }, { iata: 'KE', name: 'Korean Air' },
  { iata: 'OZ', name: 'Asiana Airlines' }, { iata: 'TK', name: 'Turkish Airlines' },
  { iata: 'QF', name: 'Qantas' }, { iata: 'NZ', name: 'Air New Zealand' },
  { iata: 'AC', name: 'Air Canada' }, { iata: 'WS', name: 'WestJet' },
  { iata: 'AZ', name: 'ITA Airways' }, { iata: 'IB', name: 'Iberia' },
  { iata: 'VY', name: 'Vueling' }, { iata: 'U2', name: 'easyJet' },
  { iata: 'FR', name: 'Ryanair' }, { iata: 'W6', name: 'Wizz Air' },
  { iata: 'SK', name: 'Scandinavian Airlines' }, { iata: 'AY', name: 'Finnair' },
  { iata: 'LX', name: 'Swiss International Air Lines' }, { iata: 'OS', name: 'Austrian Airlines' },
  { iata: 'SN', name: 'Brussels Airlines' }, { iata: 'TP', name: 'TAP Air Portugal' },
  { iata: 'A3', name: 'Aegean Airlines' }, { iata: 'BT', name: 'airBaltic' },
  { iata: 'PS', name: 'Ukraine International Airlines' }, { iata: 'SU', name: 'Aeroflot' },
  { iata: 'TG', name: 'Thai Airways' }, { iata: 'MH', name: 'Malaysia Airlines' },
  { iata: 'MI', name: 'SilkAir' }, { iata: 'GA', name: 'Garuda Indonesia' },
  { iata: 'PR', name: 'Philippine Airlines' }, { iata: 'VN', name: 'Vietnam Airlines' },
  { iata: 'VJ', name: 'VietJet Air' }, { iata: 'FD', name: 'Thai AirAsia' },
  { iata: 'AK', name: 'AirAsia' }, { iata: 'D7', name: 'AirAsia X' },
  { iata: 'TR', name: 'Scoot' }, { iata: 'CA', name: 'Air China' },
  { iata: 'MU', name: 'China Eastern Airlines' }, { iata: 'CZ', name: 'China Southern Airlines' },
  { iata: 'HU', name: 'Hainan Airlines' }, { iata: 'FM', name: 'Shanghai Airlines' },
  { iata: 'AI', name: 'Air India' }, { iata: 'UK', name: 'Vistara' },
  { iata: '6E', name: 'IndiGo' }, { iata: 'SG', name: 'SpiceJet' },
  { iata: 'MS', name: 'EgyptAir' }, { iata: 'ET', name: 'Ethiopian Airlines' },
  { iata: 'KQ', name: 'Kenya Airways' }, { iata: 'SA', name: 'South African Airways' },
  { iata: 'AT', name: 'Royal Air Maroc' }, { iata: 'TU', name: 'Tunisair' },
  { iata: 'LA', name: 'LATAM Airlines' }, { iata: 'G3', name: 'GOL Airlines' },
  { iata: 'AD', name: 'Azul Brazilian Airlines' }, { iata: 'CM', name: 'Copa Airlines' },
  { iata: 'AV', name: 'Avianca' }, { iata: 'AM', name: 'Aeromexico' },
  { iata: 'Y4', name: 'Volaris' }, { iata: 'B6', name: 'JetBlue Airways' },
  { iata: 'AS', name: 'Alaska Airlines' }, { iata: 'F9', name: 'Frontier Airlines' },
  { iata: 'NK', name: 'Spirit Airlines' }, { iata: 'G4', name: 'Allegiant Air' },
  { iata: 'SY', name: 'Sun Country Airlines' }, { iata: 'RJ', name: 'Royal Jordanian' },
  { iata: 'GF', name: 'Gulf Air' }, { iata: 'WY', name: 'Oman Air' },
  { iata: 'FZ', name: 'flydubai' }, { iata: 'G9', name: 'Air Arabia' },
  { iata: 'LY', name: 'El Al Israel Airlines' }, { iata: 'ME', name: 'Middle East Airlines' },
  { iata: 'PK', name: 'Pakistan International Airlines' }, { iata: 'UL', name: 'SriLankan Airlines' },
  { iata: 'UM', name: 'Air Zimbabwe' }, { iata: 'WB', name: 'RwandAir' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ACTIVITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  sightseeing:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  food:          { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  dining:        { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  shopping:      { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-400' },
  culture:       { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-400' },
  adventure:     { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-400' },
  nature:        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  entertainment: { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400' },
  relaxation:    { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-400' },
  default:       { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400' },
};

function getActivityColor(type: string) {
  return ACTIVITY_COLORS[type?.toLowerCase()] ?? ACTIVITY_COLORS.default;
}

function parseDescription(description: string) {
  const sections = { hours: '', price: '', transit: '', tips: '', main: '' };
  const lines = description.split('.').map(s => s.trim()).filter(Boolean);
  const mainText: string[] = [];
  lines.forEach(line => {
    const l = line.toLowerCase();
    if (l.includes('open') || l.includes('closes') || l.includes(' am') || l.includes(' pm') || l.includes('hours'))
      sections.hours += (sections.hours ? '. ' : '') + line;
    else if (l.includes('¥') || l.includes('$') || l.includes('€') || l.includes('£') || l.includes('entry') || l.includes('admission') || l.includes('free'))
      sections.price += (sections.price ? '. ' : '') + line;
    else if (l.includes('walk') || l.includes('station') || l.includes('metro') || l.includes('subway') || l.includes('train') || l.includes('bus'))
      sections.transit += (sections.transit ? '. ' : '') + line;
    else if (l.includes('reservation') || l.includes('book') || l.includes('wait') || l.includes('best') || l.includes('arrive') || l.includes('avoid'))
      sections.tips += (sections.tips ? '. ' : '') + line;
    else mainText.push(line);
  });
  sections.main = mainText.join('. ');
  return sections;
}

function isFallbackPlan(plan: any[]): boolean {
  if (!plan?.length) return false;
  const genericPattern = /^(Sightseeing|Dining|Shopping|Museums|Outdoor Activities|Relaxation|Local Culture) in /i;
  const firstActivity = plan[0]?.activities?.[0];
  return firstActivity ? genericPattern.test(firstActivity.title) : false;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}


// ─── Animation variants ───────────────────────────────────────────────────────
const cardVariants: any = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerList: any = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ─── Sortable activity card ───────────────────────────────────────────────────
interface ActivityCardProps {
  activity: any;
  dayIndex: number;
  isEditing: boolean;
  editedActivity: any;
  isDragging?: boolean;
  location?: string;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditedChange: (updated: any) => void;
}

function SortableActivityCard(props: ActivityCardProps) {
  const { activity, isDragging = false } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.35 : 1,
    zIndex: isSortableDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCardInner {...props} dragHandleProps={{ ...attributes, ...listeners }} isDragging={isDragging} />
    </div>
  );
}

function ActivityCardInner({
  activity, dayIndex, isEditing, editedActivity, isDragging = false, location = '',
  onEdit, onDelete, onSave, onCancel, onEditedChange, dragHandleProps,
}: ActivityCardProps & { dragHandleProps?: any }) {
  const color = getActivityColor(activity.type);
  const parsed = parseDescription(activity.description || '');

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className={`absolute -left-6 top-5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${color.dot}`} />

      <div className={`rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all duration-300 ${
        isDragging ? 'shadow-2xl scale-[1.02] border-primary/40' : 'hover:shadow-md hover:border-primary/25'
      }`}>
        {/* Header strip */}
        <div className={`px-5 py-3 ${color.bg} border-b border-border/30 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            {/* Drag handle */}
            <button
              {...dragHandleProps}
              className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 rounded touch-none"
              title="Hold to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <Badge variant="outline" className={`border-0 font-semibold text-xs px-2 py-0.5 ${color.bg} ${color.text}`}>
              {activity.type}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground bg-white/70 px-2 py-0.5 rounded-full border border-border/40">
              {activity.timeSlot}
            </span>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="text-muted-foreground/50 hover:text-primary hover:bg-white/60 p-1.5 rounded-lg transition-all duration-200">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-all duration-200">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Title</Label>
                  <Input value={editedActivity.title} onChange={(e) => onEditedChange({ ...editedActivity, title: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea value={editedActivity.description} onChange={(e) => onEditedChange({ ...editedActivity, description: e.target.value })} className="text-sm resize-none" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Notes</Label>
                  <Textarea value={editedActivity.notes || ''} onChange={(e) => onEditedChange({ ...editedActivity, notes: e.target.value })} placeholder="Add personal notes…" className="text-sm resize-none" rows={2} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={onSave} className="h-8"><Check className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                  <Button size="sm" variant="outline" onClick={onCancel} className="h-8"><X className="w-3.5 h-3.5 mr-1.5" />Cancel</Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="viewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h4 className="font-bold text-base text-foreground leading-snug mb-3">{activity.title}</h4>
                {parsed.main && <p className="text-sm text-foreground/75 leading-relaxed mb-3">{parsed.main}</p>}
                {(parsed.hours || parsed.price || parsed.transit || parsed.tips) && (
                  <div className="grid gap-2 mb-3">
                    {parsed.hours && (
                      <div className="flex items-start gap-2 text-xs text-foreground/65 bg-slate-50 px-3 py-2 rounded-xl">
                        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" /><span>{parsed.hours}</span>
                      </div>
                    )}
                    {parsed.price && (
                      <div className="flex items-start gap-2 text-xs text-foreground/65 bg-slate-50 px-3 py-2 rounded-xl">
                        <DollarSign className="w-3.5 h-3.5 mt-0.5 shrink-0 text-secondary" /><span>{parsed.price}</span>
                      </div>
                    )}
                    {parsed.transit && (
                      <div className="flex items-start gap-2 text-xs text-foreground/65 bg-slate-50 px-3 py-2 rounded-xl">
                        <Navigation className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" /><span>{parsed.transit}</span>
                      </div>
                    )}
                    {parsed.tips && (
                      <div className="flex items-start gap-2 text-xs text-foreground/65 bg-primary/5 border border-primary/15 px-3 py-2 rounded-xl">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" /><span>{parsed.tips}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{activity.duration}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title + (location ? `, ${location}` : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                {activity.notes && (
                  <div className="mt-3 p-3 bg-primary/5 border-l-[3px] border-primary rounded-r-xl text-sm text-foreground/80">
                    <span className="font-semibold text-primary">Notes · </span>{activity.notes}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ItineraryView({ session, itineraryId, onBack }: ItineraryViewProps) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'plan' | 'flights' | 'map'>('plan');
  const [weather, setWeather] = useState<Record<string, { tempMax: number; tempMin: number; code: number }>>({});
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editedActivity, setEditedActivity] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // dnd-kit sensors: 250ms hold on touch, immediate on pointer
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  // Add activity
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState(0);
  const [newActivity, setNewActivity] = useState({ title: '', type: 'sightseeing', timeSlot: 'Morning', duration: '1 hour', description: '', notes: '' });

  // Add flight
  const [addFlightOpen, setAddFlightOpen] = useState(false);
  const [newFlight, setNewFlight] = useState({ airline: '', iata: '', flightNumber: '', from: '', to: '', date: '', departureTime: '', arrivalTime: '', notes: '' });
  const [airlineQuery, setAirlineQuery] = useState('');
  const [airlineSuggestions, setAirlineSuggestions] = useState<typeof AIRLINES>([]);
  const [showAirlineSuggestions, setShowAirlineSuggestions] = useState(false);

  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { fetchItinerary(); }, [itineraryId]);

  const fetchWeather = async (location: string, startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;
    try {
      const city = location.split(',')[0].trim();
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) return;
      const { latitude, longitude } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&start_date=${startDate}&end_date=${endDate}&timezone=auto&forecast_days=16`
      );
      const data = await weatherRes.json();
      if (data.daily) {
        const map: Record<string, { tempMax: number; tempMin: number; code: number }> = {};
        data.daily.time.forEach((date: string, i: number) => {
          map[date] = {
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
            code: data.daily.weathercode[i],
          };
        });
        setWeather(map);
      }
    } catch { /* silently fail — weather is non-critical */ }
  };

  const fetchItinerary = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setItinerary(data.itinerary);
        fetchWeather(data.itinerary.location, data.itinerary.startDate, data.itinerary.endDate);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const savePlan = async (updatedPlan: any[]) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: updatedPlan }),
      }
    );
    const data = await response.json();
    if (response.ok) setItinerary(data.itinerary);
    return response.ok;
  };

  const saveFlights = async (updatedFlights: any[]) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ flights: updatedFlights }),
      }
    );
    const data = await response.json();
    if (response.ok) setItinerary(data.itinerary);
    return response.ok;
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}/generate`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      await fetchItinerary();
    } catch (error) { console.error('Failed to regenerate:', error); }
    finally { setRegenerating(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ username: inviteUsername }),
        }
      );
      const data = await response.json();
      if (response.ok) { setItinerary(data.itinerary); setInviteUsername(''); setInviteDialogOpen(false); }
      else alert(data.error || 'Failed to invite collaborator');
    } catch (error) { alert('Failed to invite collaborator'); }
  };

  // ── Activity CRUD ──
  const handleEditActivity = (dayIndex: number, activityId: string) => {
    const activity = itinerary.plan[dayIndex].activities.find((a: any) => a.id === activityId);
    setEditedActivity({ ...activity, dayIndex });
    setEditingActivity(activityId);
  };

  const handleSaveActivity = async () => {
    if (!editedActivity) return;
    const updatedPlan = [...itinerary.plan];
    const dayIndex = editedActivity.dayIndex;
    const actIndex = updatedPlan[dayIndex].activities.findIndex((a: any) => a.id === editedActivity.id);
    updatedPlan[dayIndex].activities[actIndex] = {
      id: editedActivity.id, timeSlot: editedActivity.timeSlot, type: editedActivity.type,
      title: editedActivity.title, description: editedActivity.description,
      duration: editedActivity.duration, notes: editedActivity.notes,
    };
    const ok = await savePlan(updatedPlan);
    if (ok) { setEditingActivity(null); setEditedActivity(null); }
  };

  const handleDeleteActivity = async (dayIndex: number, activityId: string) => {
    if (!confirm('Remove this activity?')) return;
    const updatedPlan = [...itinerary.plan];
    updatedPlan[dayIndex].activities = updatedPlan[dayIndex].activities.filter((a: any) => a.id !== activityId);
    await savePlan(updatedPlan);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent, dayIndex: number) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const updatedPlan = [...itinerary.plan];
    const activities = [...updatedPlan[dayIndex].activities];
    const oldIndex = activities.findIndex((a: any) => a.id === active.id);
    const newIndex = activities.findIndex((a: any) => a.id === over.id);
    updatedPlan[dayIndex].activities = arrayMove(activities, oldIndex, newIndex);
    // Optimistic update
    setItinerary({ ...itinerary, plan: updatedPlan });
    await savePlan(updatedPlan);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlan = [...itinerary.plan];
    updatedPlan[addActivityDayIndex].activities.push({
      id: generateId(),
      ...newActivity,
    });
    const ok = await savePlan(updatedPlan);
    if (ok) {
      setAddActivityOpen(false);
      setNewActivity({ title: '', type: 'sightseeing', timeSlot: 'Morning', duration: '1 hour', description: '', notes: '' });
    }
  };

  // ── Flight CRUD ──
  const handleAirlineChange = (q: string) => {
    setAirlineQuery(q);
    if (q.length === 0) { setAirlineSuggestions([]); setShowAirlineSuggestions(false); return; }
    const filtered = AIRLINES.filter(a =>
      a.name.toLowerCase().includes(q.toLowerCase()) || a.iata.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);
    setAirlineSuggestions(filtered);
    setShowAirlineSuggestions(true);
  };

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const existingFlights = itinerary.flights || [];
    const updatedFlights = [...existingFlights, { id: generateId(), ...newFlight }];
    const ok = await saveFlights(updatedFlights);
    if (ok) {
      setAddFlightOpen(false);
      setNewFlight({ airline: '', iata: '', flightNumber: '', from: '', to: '', date: '', departureTime: '', arrivalTime: '', notes: '' });
      setAirlineQuery('');
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!confirm('Remove this flight?')) return;
    const updatedFlights = (itinerary.flights || []).filter((f: any) => f.id !== flightId);
    await saveFlights(updatedFlights);
  };

  const scrollToDay = (index: number) => {
    setActiveDay(index);
    dayRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-background gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img src={logo} alt="WhereTwo" className="w-40 h-auto -my-4" style={{ filter: 'invert(1)' }} />
        </motion.div>
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
        <p className="text-sm text-muted-foreground">Building your itinerary…</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="text-muted-foreground">Itinerary not found.</p>
      </div>
    );
  }

  const isOwner = itinerary.ownerId === session.user.id;
  const flights: any[] = itinerary.flights || [];

  return (
    <div className="size-full flex flex-col overflow-hidden bg-background">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative shrink-0 overflow-hidden">
        <img src={headerBg} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_42%] scale-105 blur-[2px]" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost" size="icon" onClick={onBack}
                className="text-white hover:bg-white/20 border border-white/25 backdrop-blur-sm mt-0.5 shrink-0 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{itinerary.location}{itinerary.area ? ` · ${itinerary.area}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {itinerary.startDate && itinerary.endDate ? (
                      <span>{format(new Date(itinerary.startDate), 'MMM d')} – {format(new Date(itinerary.endDate), 'MMM d, yyyy')} · {itinerary.days} days</span>
                    ) : <span>{itinerary.days} days</span>}
                  </div>
                  {itinerary.base && (
                    <div className="flex items-center gap-1.5 text-white/60 text-xs">
                      <span>Staying in {itinerary.base}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm shrink-0 transition-all duration-200">
                    <UserPlus className="w-4 h-4 mr-2" />Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Collaborator</DialogTitle>
                    <DialogDescription>Enter the username of the person you want to invite.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required placeholder="wheretwo-user-0" />
                    </div>
                    <Button type="submit" className="w-full">Send Invitation</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* ── Tabs bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-border/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {/* Team */}
            <div className="flex items-center gap-2 mr-3 pr-3 border-r border-border/60 shrink-0">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex -space-x-1">
                <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                  @{itinerary.ownerUsername}
                </span>
                {itinerary.collaborators.map((c: any) => (
                  <span key={c.userId} className="text-xs font-medium bg-muted text-foreground px-2 py-0.5 rounded-full border border-white">
                    @{c.username}
                  </span>
                ))}
              </div>
            </div>

            {/* Flights tab */}
            <motion.button
              onClick={() => setActiveTab('flights')}
              whileTap={{ scale: 0.95 }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 mr-1 ${
                activeTab === 'flights'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Flights {flights.length > 0 && <span className="text-xs opacity-70">({flights.length})</span>}
            </motion.button>

            {/* Map tab */}
            <motion.button
              onClick={() => setActiveTab('map')}
              whileTap={{ scale: 0.95 }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 mr-1 ${
                activeTab === 'map'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </motion.button>

            {/* Separator */}
            <div className="w-px h-5 bg-border/60 shrink-0 mr-1" />

            {/* Day tabs */}
            {itinerary.plan.map((day: any, i: number) => (
              <motion.button
                key={day.day}
                onClick={() => { setActiveTab('plan'); scrollToDay(i); }}
                whileTap={{ scale: 0.95 }}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'plan' && activeDay === i
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                Day {day.day}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fallback warning ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFallbackPlan(itinerary?.plan) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="shrink-0 bg-amber-50 border-b border-amber-200 px-6 py-3"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">AI quota reached — showing placeholder itinerary</p>
                  <p className="text-xs text-amber-700 mt-0.5">The Gemini API free tier (20 req/day) is exhausted. Try again after midnight UTC.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}
                className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100">
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Retrying…' : 'Retry'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">

          {/* ════ FLIGHTS TAB ════ */}
          {activeTab === 'flights' && (
            <motion.div
              key="flights"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-6 py-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Flights</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Track your flights for this trip</p>
                </div>
                <Button onClick={() => setAddFlightOpen(true)} className="shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />Add Flight
                </Button>
              </div>

              {flights.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                    <Plane className="w-8 h-8 text-primary/40" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">No flights added yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-xs">Add your flight details to keep everything in one place.</p>
                  <Button onClick={() => setAddFlightOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Add First Flight
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {flights.map((flight: any, i: number) => (
                    <motion.div
                      key={flight.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Blue accent top bar */}
                      <div className="h-1 bg-primary" />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Airline logo placeholder */}
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                              <Plane className="w-5 h-5 text-primary" />
                              <span className="text-[10px] font-bold text-primary mt-0.5">{flight.iata || '—'}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground">{flight.airline || 'Unknown Airline'}</span>
                                {flight.flightNumber && (
                                  <Badge variant="outline" className="text-xs font-mono font-semibold">
                                    {flight.iata}{flight.flightNumber}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-foreground">{flight.from || '—'}</p>
                                  {flight.departureTime && <p className="text-xs text-muted-foreground">{flight.departureTime}</p>}
                                </div>
                                <div className="flex-1 flex items-center gap-1 min-w-[60px]">
                                  <div className="flex-1 h-px bg-border" />
                                  <Plane className="w-3 h-3 text-muted-foreground rotate-90" />
                                  <div className="flex-1 h-px bg-border" />
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-foreground">{flight.to || '—'}</p>
                                  {flight.arrivalTime && <p className="text-xs text-muted-foreground">{flight.arrivalTime}</p>}
                                </div>
                              </div>
                              {flight.date && (
                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{flight.date}
                                </p>
                              )}
                              {flight.notes && (
                                <p className="text-xs text-foreground/70 mt-2 bg-muted px-2.5 py-1.5 rounded-lg">{flight.notes}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFlight(flight.id)}
                            className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 p-1.5 rounded-lg transition-all duration-200 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ MAP TAB ════ */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Map</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{itinerary.location}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(itinerary.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div
                  className="rounded-2xl overflow-hidden border border-border/60 shadow-sm"
                  style={{ height: 'calc(100vh - 320px)', minHeight: 420 }}
                >
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(itinerary.location)}&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    title={`Map of ${itinerary.location}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground pb-2">
                  Tap <span className="font-semibold">Maps</span> on any activity card to search that specific stop.
                </p>
              </div>
            </motion.div>
          )}

          {/* ════ PLAN TAB ════ */}
          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto px-6 py-8 space-y-12"
            >
              {itinerary.plan.map((day: any, dayIndex: number) => (
                <motion.div
                  key={day.day}
                  ref={(el) => { dayRefs.current[dayIndex] = el; }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/25 shrink-0">
                      {day.day}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Day {day.day}</h2>
                      {day.date && <p className="text-sm text-muted-foreground">{day.date}</p>}
                    </div>
                    {(() => {
                      const dayDate = itinerary.startDate
                        ? format(addDays(new Date(itinerary.startDate), dayIndex), 'yyyy-MM-dd')
                        : null;
                      const w = dayDate ? weather[dayDate] : undefined;
                      return w ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-full text-sm shrink-0">
                          <WeatherIcon code={w.code} size={18} />
                          <span className="font-semibold text-sky-700">{w.tempMax}°</span>
                          <span className="text-sky-400">/</span>
                          <span className="text-sky-500">{w.tempMin}°C</span>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </div>

                  {/* Activities — sortable */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={(e) => handleDragEnd(e, dayIndex)}
                  >
                    <SortableContext
                      items={day.activities.map((a: any) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <motion.div className="relative pl-6" variants={staggerList} initial="initial" animate="animate">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/30 via-border to-transparent rounded-full" />
                        <div className="space-y-4">
                          {day.activities.map((activity: any) => (
                            <SortableActivityCard
                              key={activity.id}
                              activity={activity}
                              dayIndex={dayIndex}
                              isEditing={editingActivity === activity.id}
                              editedActivity={editedActivity}
                              location={itinerary.location}
                              onEdit={() => handleEditActivity(dayIndex, activity.id)}
                              onDelete={() => handleDeleteActivity(dayIndex, activity.id)}
                              onSave={handleSaveActivity}
                              onCancel={() => { setEditingActivity(null); setEditedActivity(null); }}
                              onEditedChange={setEditedActivity}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </SortableContext>

                    {/* Drag overlay — floating ghost card */}
                    <DragOverlay>
                      {activeId ? (() => {
                        const dragActivity = day.activities.find((a: any) => a.id === activeId);
                        return dragActivity ? (
                          <div className="pl-6">
                            <ActivityCardInner
                              activity={dragActivity}
                              dayIndex={dayIndex}
                              isEditing={false}
                              editedActivity={null}
                              isDragging={true}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              onSave={() => {}}
                              onCancel={() => {}}
                              onEditedChange={() => {}}
                            />
                          </div>
                        ) : null;
                      })() : null}
                    </DragOverlay>
                  </DndContext>

                  {/* Add activity button */}
                  <motion.button
                    onClick={() => { setAddActivityDayIndex(dayIndex); setAddActivityOpen(true); }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 ml-6 w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border/70 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/3 transition-all duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add activity to Day {day.day}
                  </motion.button>

                  {/* Day connector */}
                  {dayIndex < itinerary.plan.length - 1 && (
                    <div className="flex items-center justify-center mt-8">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                        <div className="w-8 h-px bg-border" />
                        <ChevronRight className="w-3 h-3" />
                        <div className="w-8 h-px bg-border" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD ACTIVITY DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>Add a new activity to Day {addActivityDayIndex + 1}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Title</Label>
              <Input value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} required placeholder="e.g. Visit Eiffel Tower" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Type</Label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.keys(ACTIVITY_COLORS).filter(k => k !== 'default').map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Time Slot</Label>
                <select
                  value={newActivity.timeSlot}
                  onChange={(e) => setNewActivity({ ...newActivity, timeSlot: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {['Early Morning', 'Morning', 'Late Morning', 'Noon', 'Afternoon', 'Late Afternoon', 'Evening', 'Night'].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Duration</Label>
              <Input value={newActivity.duration} onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })} placeholder="e.g. 2 hours" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} placeholder="What will you do here?" className="resize-none text-sm" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea value={newActivity.notes} onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })} placeholder="Personal notes, tips…" className="resize-none text-sm" rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1">Add Activity</Button>
              <Button type="button" variant="outline" onClick={() => setAddActivityOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD FLIGHT DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addFlightOpen} onOpenChange={setAddFlightOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Flight</DialogTitle>
            <DialogDescription>Enter your flight details to track it in this trip.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFlight} className="space-y-4">

            {/* Airline autocomplete */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Airline</Label>
              <div className="relative">
                <Input
                  value={airlineQuery}
                  onChange={(e) => handleAirlineChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowAirlineSuggestions(false), 200)}
                  onFocus={() => airlineQuery && setShowAirlineSuggestions(true)}
                  placeholder="Search airline…"
                  className="h-10"
                  required
                />
                <AnimatePresence>
                  {showAirlineSuggestions && airlineSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-auto"
                    >
                      {airlineSuggestions.map((airline) => (
                        <button
                          key={airline.iata}
                          type="button"
                          onClick={() => {
                            setAirlineQuery(airline.name);
                            setNewFlight({ ...newFlight, airline: airline.name, iata: airline.iata });
                            setShowAirlineSuggestions(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{airline.iata}</span>
                          <span className="text-sm text-slate-900">{airline.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Flight number */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Flight Number</Label>
              <div className="flex gap-2">
                <div className="w-16 h-10 flex items-center justify-center bg-muted rounded-md border border-input text-sm font-bold text-muted-foreground shrink-0">
                  {newFlight.iata || '—'}
                </div>
                <Input
                  value={newFlight.flightNumber}
                  onChange={(e) => setNewFlight({ ...newFlight, flightNumber: e.target.value.toUpperCase().replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 1234"
                  className="h-10 font-mono"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Numbers only — the IATA code is prefixed automatically</p>
            </div>

            {/* Route */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">From</Label>
                <Input value={newFlight.from} onChange={(e) => setNewFlight({ ...newFlight, from: e.target.value.toUpperCase() })} placeholder="e.g. LAX" className="h-10 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">To</Label>
                <Input value={newFlight.to} onChange={(e) => setNewFlight({ ...newFlight, to: e.target.value.toUpperCase() })} placeholder="e.g. NRT" className="h-10 font-mono" />
              </div>
            </div>

            {/* Date & times */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Date</Label>
              <Input type="date" value={newFlight.date} onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Departure</Label>
                <Input type="time" value={newFlight.departureTime} onChange={(e) => setNewFlight({ ...newFlight, departureTime: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Arrival</Label>
                <Input type="time" value={newFlight.arrivalTime} onChange={(e) => setNewFlight({ ...newFlight, arrivalTime: e.target.value })} className="h-10" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={newFlight.notes} onChange={(e) => setNewFlight({ ...newFlight, notes: e.target.value })} placeholder="Seat number, confirmation code…" className="h-10" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1">Save Flight</Button>
              <Button type="button" variant="outline" onClick={() => setAddFlightOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
