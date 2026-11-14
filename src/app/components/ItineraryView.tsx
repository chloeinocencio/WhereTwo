import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE, authHeaders } from '../../lib/supabase';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import {
  ArrowLeft, MapPin, Calendar, UserPlus, Edit2, Check, X, Clock, DollarSign, Navigation,
  Info, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Plus, Trash2, Plane, GripVertical,
  ExternalLink, Map as MapIcon, Search, BedDouble,
} from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { WeatherIcon } from './WeatherIcon';
import { INK, MIST, TODAY, getActivityKind } from '../../lib/tripVisuals';
import { usePlacePhoto } from '../../lib/placePhotos';
import logo from '../../assets/logo.png';
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
/** Gemini writes "Place Name (street address)"; show the name as the title and the address under it. */
function splitTitle(title: string) {
  const match = /^(.*?)\s*\(([^)]*\d[^)]*)\)\s*$/.exec(title || '');
  return match ? { name: match[1], address: match[2] } : { name: title, address: '' };
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
    else if (/\b(minute|min)s?\s+walk|\bwalk\s+(from|to)\b|\bstation\b|\bmetro\b|\bsubway\b|\btrain\b|\bbus\b|\btaxi\b/.test(l))
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


// ─── Sortable activity card ───────────────────────────────────────────────────
interface ActivityCardProps {
  activity: any;
  dayIndex: number;
  isEditing: boolean;
  editedActivity: any;
  isDragging?: boolean;
  location?: string;
  /** Show the time-slot label (only on the first stop of each slot). */
  showSlot?: boolean;
  /** Last stop of the day: the route line stops here. */
  isLast?: boolean;
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
  activity, isEditing, editedActivity, isDragging = false, location = '', showSlot = true, isLast = false,
  onEdit, onDelete, onSave, onCancel, onEditedChange, dragHandleProps,
}: ActivityCardProps & { dragHandleProps?: any }) {
  const kind = getActivityKind(activity.type);
  const Icon = kind.icon;
  const parsed = parseDescription(activity.description || '');
  const { name, address } = splitTitle(activity.title);
  const facts = [
    { text: parsed.hours, icon: Clock },
    { text: parsed.price, icon: DollarSign },
    { text: parsed.transit, icon: Navigation },
    { text: parsed.tips, icon: Info },
  ].filter((f) => f.text);

  return (
    <div className={`group grid sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-6 ${isDragging ? 'rounded-2xl bg-white shadow-xl ring-1 ring-[#DDE4F3] px-4 pt-4' : ''}`}>
      {/* Time of day, aligned with the stop's marker */}
      <div className="hidden sm:block pt-2 text-right text-sm font-medium" style={{ color: '#5B6B8C' }}>
        {showSlot ? activity.timeSlot : ''}
      </div>

      <div className="relative pl-14 pb-9">
        {/* Route line to the next stop */}
        {!isLast && <div className="absolute left-[19px] top-11 bottom-0 w-[2px] rounded-full" style={{ background: MIST }} />}
        {/* Stop marker */}
        <div
          className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full"
          style={{ background: `${kind.color}1A`, color: kind.color }}
          title={activity.type}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </div>

        {isEditing ? (
          <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-[#DDE4F3]">
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
              <Textarea value={editedActivity.notes || ''} onChange={(e) => onEditedChange({ ...editedActivity, notes: e.target.value })} placeholder="Reservations, who's paying, what to bring…" className="text-sm resize-none" rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={onSave} className="h-8"><Check className="w-3.5 h-3.5 mr-1.5" />Save</Button>
              <Button size="sm" variant="outline" onClick={onCancel} className="h-8"><X className="w-3.5 h-3.5 mr-1.5" />Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-h-10 flex-wrap items-center gap-x-3 text-sm" style={{ color: '#5B6B8C' }}>
              {showSlot && <span className="font-medium sm:hidden">{activity.timeSlot}</span>}
              {activity.duration && <span>{activity.duration}</span>}
            </div>

            <h4 className="font-display text-[19px] font-semibold leading-snug tracking-[-0.01em]" style={{ color: INK }}>{name}</h4>
            {address && <p className="mt-0.5 text-sm" style={{ color: '#5B6B8C' }}>{address}</p>}

            {parsed.main && (
              <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: '#3A4A6B' }}>{parsed.main}</p>
            )}

            {facts.length > 0 && (
              <ul className="mt-3 max-w-[62ch] space-y-1.5">
                {facts.map(({ text, icon: FactIcon }, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: '#4A5A7A' }}>
                    <FactIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: kind.color }} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            )}

            {activity.notes && (
              <p className="mt-3 max-w-[62ch] rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-[#DDE4F3]" style={{ color: '#3A4A6B' }}>
                <span className="font-semibold" style={{ color: INK }}>Note: </span>{activity.notes}
              </p>
            )}

            <div className="mt-3 flex items-center gap-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title + (location ? `, ${location}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/8"
              >
                <MapIcon className="h-4 w-4" />Directions
              </a>
              {/* Edit controls: always visible on touch, revealed on hover/focus with a mouse */}
              <div className="ml-auto flex items-center gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                <button onClick={onEdit} className="rounded-lg p-2 text-[#5B6B8C] hover:bg-white hover:text-primary" aria-label="Edit stop">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={onDelete} className="rounded-lg p-2 text-[#5B6B8C] hover:bg-destructive/10 hover:text-destructive" aria-label="Remove stop">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  {...dragHandleProps}
                  className="cursor-grab touch-none rounded-lg p-2 text-[#5B6B8C] hover:bg-white active:cursor-grabbing"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ItineraryView({ session, itineraryId, onBack }: ItineraryViewProps) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const placePhoto = usePlacePhoto(itinerary?.location);
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
  const [flightLookupLoading, setFlightLookupLoading] = useState(false);
  const [flightLookupError, setFlightLookupError] = useState('');
  const [airlineSuggestions, setAirlineSuggestions] = useState<typeof AIRLINES>([]);
  const [showAirlineSuggestions, setShowAirlineSuggestions] = useState(false);


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
        `${API_BASE}/itineraries/${itineraryId}`,
        { headers: authHeaders(session.access_token) }
      );
      const data = await response.json();
      if (response.ok) {
        setItinerary(data.itinerary);
        if (data.itinerary.startDate) {
          const offset = Math.round((new Date().setHours(0, 0, 0, 0) - parseISO(data.itinerary.startDate).getTime()) / 86400000);
          if (offset >= 0 && offset < data.itinerary.plan.length) setActiveDay(offset);
        }
        fetchWeather(data.itinerary.location, data.itinerary.startDate, data.itinerary.endDate);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const savePlan = async (updatedPlan: any[]) => {
    const response = await fetch(
      `${API_BASE}/itineraries/${itineraryId}`,
      {
        method: 'PUT',
        headers: authHeaders(session.access_token),
        body: JSON.stringify({ plan: updatedPlan }),
      }
    );
    const data = await response.json();
    if (response.ok) setItinerary(data.itinerary);
    return response.ok;
  };

  const saveFlights = async (updatedFlights: any[]) => {
    const response = await fetch(
      `${API_BASE}/itineraries/${itineraryId}`,
      {
        method: 'PUT',
        headers: authHeaders(session.access_token),
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
        `${API_BASE}/itineraries/${itineraryId}/generate`,
        { method: 'POST', headers: authHeaders(session.access_token) }
      );
      await fetchItinerary();
    } catch (error) { console.error('Failed to regenerate:', error); }
    finally { setRegenerating(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_BASE}/itineraries/${itineraryId}/invite`,
        {
          method: 'POST',
          headers: authHeaders(session.access_token),
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

  // Fills in route, date and times from the flight number (AviationStack, via the edge function).
  const handleLookupFlight = async () => {
    if (!newFlight.iata || !newFlight.flightNumber) return;
    setFlightLookupLoading(true);
    setFlightLookupError('');
    try {
      const response = await fetch(
        `${API_BASE}/flights/lookup?flight=${encodeURIComponent(newFlight.iata + newFlight.flightNumber)}`,
        { headers: authHeaders(session.access_token) }
      );
      const data = await response.json();
      if (!response.ok) { setFlightLookupError(data.error || 'Flight lookup failed. Enter the details manually.'); return; }
      const found = data.flight;
      setNewFlight(prev => ({
        ...prev,
        from: found.from || prev.from,
        to: found.to || prev.to,
        date: found.date || prev.date,
        departureTime: found.departureTime || prev.departureTime,
        arrivalTime: found.arrivalTime || prev.arrivalTime,
      }));
    } catch {
      setFlightLookupError('Could not reach flight lookup. Enter the details manually.');
    } finally {
      setFlightLookupLoading(false);
    }
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
      setFlightLookupError('');
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!confirm('Remove this flight?')) return;
    const updatedFlights = (itinerary.flights || []).filter((f: any) => f.id !== flightId);
    await saveFlights(updatedFlights);
  };

  const selectDay = (index: number) => {
    setActiveTab('plan');
    setActiveDay(index);
    // Bring the day's heading up under the sticky day strip.
    const scroller = document.getElementById('trip-scroll');
    const strip = document.getElementById('trip-days');
    if (scroller && strip && scroller.scrollTop > strip.offsetTop) {
      scroller.scrollTo({ top: strip.offsetTop, behavior: 'smooth' });
    }
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
    <div id="trip-scroll" className="size-full overflow-auto bg-[#F4F6FB]">

      {/* ── Header: trip name over the travel photo ──────────────────────────── */}
      <header className="relative overflow-hidden text-white" style={{ background: INK }}>
        {/* The destination's own photo once it's found; the default travel photo until then */}
        <img src={placePhoto?.url || headerBg} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
        {/* Darken toward the bottom-left, where the title and details sit, so they stay readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1F4D]/90 via-[#0E1F4D]/55 to-[#0E1F4D]/25" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-4 pb-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost" size="icon" onClick={onBack}
              className="-ml-2 rounded-full text-white hover:bg-white/15 hover:text-white"
              aria-label="Back to your trips"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/30">
                    <UserPlus className="w-4 h-4 mr-2" />Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite someone to this trip</DialogTitle>
                    <DialogDescription>They'll be able to see and edit the plan with you. Ask them for their WhereTwo username.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required placeholder="wheretwo-user-0" />
                    </div>
                    <Button type="submit" className="w-full">Send invite</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <h1 className="font-display mt-4 text-[34px] sm:text-[46px] font-bold leading-[1.02] tracking-[-0.025em] text-balance">
            {itinerary.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[15px] text-white/85">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-white/70" />{itinerary.location}</span>
            {itinerary.startDate && itinerary.endDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-white/70" />
                {format(parseISO(itinerary.startDate), 'MMM d')} – {format(parseISO(itinerary.endDate), 'MMM d, yyyy')}
              </span>
            )}
            {itinerary.base && <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-white/70" />{itinerary.base}</span>}
          </div>

          {placePhoto && (
            <a
              href={placePhoto.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-5 sm:right-8 text-[11px] text-white/60 hover:text-white hover:underline"
            >
              Photo: Wikimedia Commons
            </a>
          )}

          {/* Travelers */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[itinerary.ownerUsername, ...itinerary.collaborators.map((c: any) => c.username)].map((name: string) => (
                <span
                  key={name}
                  title={`@${name}`}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-semibold ring-2 ring-[#0E1F4D]/60"
                  style={{ color: INK }}
                >
                  {name?.[0]?.toUpperCase()}
                </span>
              ))}
            </div>
            <span className="text-sm text-white/80">
              {[itinerary.ownerUsername, ...itinerary.collaborators.map((c: any) => c.username)].map((n: string) => `@${n}`).join(', ')}
            </span>
          </div>
        </div>
      </header>

      {/* ── Day strip + view switcher ──────────────────────────────────────── */}
      <nav id="trip-days" className="sticky top-0 z-20 border-b bg-[#F4F6FB]/95 backdrop-blur" style={{ borderColor: MIST }} aria-label="Trip days">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5">
            {itinerary.plan.map((day: any, i: number) => {
              const date = itinerary.startDate ? addDays(parseISO(itinerary.startDate), i) : null;
              const w = date ? weather[format(date, 'yyyy-MM-dd')] : undefined;
              const selected = activeTab === 'plan' && activeDay === i;
              const isToday = date ? isSameDay(date, new Date()) : false;
              return (
                <button
                  key={day.day}
                  onClick={() => selectDay(i)}
                  aria-current={selected ? 'date' : undefined}
                  className={`relative w-[86px] shrink-0 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                    selected ? 'text-white' : 'bg-white ring-1 ring-[#DDE4F3] hover:ring-[#B9C6E6]'
                  }`}
                  style={selected ? { background: INK } : { color: INK }}
                >
                  {isToday && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full" style={{ background: TODAY }} aria-label="Today" />
                  )}
                  <span className="font-display block text-[26px] font-bold leading-none">{day.day}</span>
                  <span className={`mt-1 block text-xs ${selected ? 'text-white/75' : 'text-[#5B6B8C]'}`}>
                    {date ? format(date, 'EEE d') : `Day ${day.day}`}
                  </span>
                  {w && (
                    <span className={`mt-1 flex items-center gap-1 text-xs font-medium ${selected ? 'text-white/90' : 'text-[#3A4A6B]'}`}>
                      <WeatherIcon code={w.code} size={14} />{w.tempMax}°
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 self-start rounded-full bg-white p-1 ring-1 ring-[#DDE4F3] sm:self-auto" role="tablist">
            {([
              { id: 'plan', label: 'Plan' },
              { id: 'map', label: 'Map' },
              { id: 'flights', label: flights.length ? `Flights (${flights.length})` : 'Flights' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-[#5B6B8C] hover:text-[#0E1F4D]'
                }`}
                style={activeTab === tab.id ? { background: INK } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Placeholder-plan warning ───────────────────────────────────────── */}
      {isFallbackPlan(itinerary?.plan) && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">This is a placeholder plan</p>
                <p className="text-xs text-amber-800 mt-0.5">The AI planner hit its daily limit. Try again after 5 PM Arizona time (midnight UTC).</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}
              className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Planning…' : 'Plan again'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="bg-[#F4F6FB]">
        <AnimatePresence mode="wait">

          {/* ════ FLIGHTS TAB ════ */}
          {activeTab === 'flights' && (
            <motion.div
              key="flights"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto px-5 sm:px-8 py-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Flights</h2>
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
              <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Map</h2>
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
                  Use <span className="font-semibold">Directions</span> on any stop to open it in Google Maps.
                </p>
              </div>
            </motion.div>
          )}

          {/* ════ PLAN: one day at a time ════ */}
          {activeTab === 'plan' && (() => {
            const day = itinerary.plan[activeDay];
            if (!day) return null;
            const dayIndex = activeDay;
            const date = itinerary.startDate ? addDays(parseISO(itinerary.startDate), dayIndex) : null;
            const isToday = date ? isSameDay(date, new Date()) : false;
            const w = date ? weather[format(date, 'yyyy-MM-dd')] : undefined;
            return (
              <motion.div
                key={`day-${day.day}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-16"
              >
                {/* Day heading */}
                <div className="mb-8 sm:pl-[120px]">
                  <h2 className="font-display text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.02em]" style={{ color: INK }}>
                    {date ? format(date, 'EEEE, MMMM d') : `Day ${day.day}`}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]" style={{ color: '#5B6B8C' }}>
                    {isToday && (
                      <span className="rounded-full px-2.5 py-0.5 text-sm font-semibold" style={{ background: '#FDF0D9', color: '#8A5300' }}>Today</span>
                    )}
                    <span>Day {day.day} of {itinerary.plan.length}</span>
                    {w && (
                      <span className="flex items-center gap-1.5">
                        <WeatherIcon code={w.code} size={18} />
                        High {w.tempMax}°, low {w.tempMin}°C
                      </span>
                    )}
                  </div>
                </div>

                {/* The day's route — sortable */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, dayIndex)}
                >
                  <SortableContext items={day.activities.map((a: any) => a.id)} strategy={verticalListSortingStrategy}>
                    <div>
                      {day.activities.map((activity: any, i: number) => (
                        <SortableActivityCard
                          key={activity.id}
                          activity={activity}
                          dayIndex={dayIndex}
                          isEditing={editingActivity === activity.id}
                          editedActivity={editedActivity}
                          location={itinerary.location}
                          showSlot={i === 0 || day.activities[i - 1].timeSlot !== activity.timeSlot}
                          isLast={i === day.activities.length - 1}
                          onEdit={() => handleEditActivity(dayIndex, activity.id)}
                          onDelete={() => handleDeleteActivity(dayIndex, activity.id)}
                          onSave={handleSaveActivity}
                          onCancel={() => { setEditingActivity(null); setEditedActivity(null); }}
                          onEditedChange={setEditedActivity}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (() => {
                      const dragActivity = day.activities.find((a: any) => a.id === activeId);
                      return dragActivity ? (
                        <ActivityCardInner
                          activity={dragActivity}
                          dayIndex={dayIndex}
                          isEditing={false}
                          editedActivity={null}
                          isDragging={true}
                          isLast
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onSave={() => {}}
                          onCancel={() => {}}
                          onEditedChange={() => {}}
                        />
                      ) : null;
                    })() : null}
                  </DragOverlay>
                </DndContext>

                {day.activities.length === 0 && (
                  <p className="mb-6 sm:pl-[120px] text-[15px]" style={{ color: '#5B6B8C' }}>
                    Nothing planned yet. Add a stop, or keep the day free to wander.
                  </p>
                )}

                {/* Add a stop */}
                <div className="sm:pl-[120px]">
                  <button
                    onClick={() => { setAddActivityDayIndex(dayIndex); setAddActivityOpen(true); }}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 text-[15px] font-medium text-[#5B6B8C] transition-colors hover:border-primary/50 hover:text-primary"
                    style={{ borderColor: MIST }}
                  >
                    <Plus className="h-5 w-5" />
                    Add a stop to day {day.day}
                  </button>
                </div>

                {/* Previous / next day */}
                {itinerary.plan.length > 1 && (
                  <div className="mt-10 flex items-center justify-between sm:pl-[120px]">
                    {dayIndex > 0 ? (
                      <Button variant="ghost" onClick={() => selectDay(dayIndex - 1)} className="-ml-3 text-[#3A4A6B]">
                        <ChevronLeft className="mr-1 h-4 w-4" />Day {itinerary.plan[dayIndex - 1].day}
                      </Button>
                    ) : <span />}
                    {dayIndex < itinerary.plan.length - 1 && (
                      <Button variant="ghost" onClick={() => selectDay(dayIndex + 1)} className="-mr-3 text-[#3A4A6B]">
                        Day {itinerary.plan[dayIndex + 1].day}<ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })()}
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
                  {['sightseeing', 'dining', 'shopping', 'culture', 'nature', 'adventure', 'entertainment', 'relaxation'].map(type => (
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
                  onChange={(e) => { setNewFlight({ ...newFlight, flightNumber: e.target.value.toUpperCase().replace(/[^0-9]/g, '') }); setFlightLookupError(''); }}
                  placeholder="e.g. 1234"
                  className="h-10 font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={handleLookupFlight}
                  disabled={!newFlight.iata || !newFlight.flightNumber || flightLookupLoading}
                >
                  {flightLookupLoading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    : <Search className="w-4 h-4" />}
                  Fill in
                </Button>
              </div>
              {flightLookupError
                ? <p className="text-xs text-destructive">{flightLookupError}</p>
                : <p className="text-xs text-muted-foreground">Numbers only — the IATA code is prefixed automatically. Tap Fill in to look up the route and times.</p>}
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
