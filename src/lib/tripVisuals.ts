import {
  Landmark, UtensilsCrossed, ShoppingBag, Palette, Trees, Mountain, Ticket, Coffee, MapPin,
  type LucideIcon,
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';

// Shared by the trips list and the trip page (and mirrored in the iOS app's Theme.swift).

export const INK = '#0E1F4D';
export const SLATE = '#5B6B8C';
export const MIST = '#DDE4F3';
export const PAPER = '#F4F6FB';
export const TODAY = '#F5A524';

/** Icon and tint for each activity type, used for stop markers and plan previews. */
const ACTIVITY_KINDS: Record<string, { icon: LucideIcon; color: string }> = {
  sightseeing:   { icon: Landmark,        color: '#3D63DD' },
  food:          { icon: UtensilsCrossed, color: '#D9672E' },
  dining:        { icon: UtensilsCrossed, color: '#D9672E' },
  shopping:      { icon: ShoppingBag,     color: '#8E54D6' },
  culture:       { icon: Palette,         color: '#C2477E' },
  museums:       { icon: Palette,         color: '#C2477E' },
  nature:        { icon: Trees,           color: '#24936A' },
  adventure:     { icon: Mountain,        color: '#24936A' },
  entertainment: { icon: Ticket,          color: '#6A4CC9' },
  nightlife:     { icon: Ticket,          color: '#6A4CC9' },
  relaxation:    { icon: Coffee,          color: '#23929C' },
};
const DEFAULT_KIND = { icon: MapPin, color: SLATE };

export function getActivityKind(type: string) {
  const key = (type || '').toLowerCase();
  return ACTIVITY_KINDS[key]
    ?? Object.entries(ACTIVITY_KINDS).find(([k]) => key.includes(k))?.[1]
    ?? DEFAULT_KIND;
}

/**
 * Each destination gets its own color pair, picked from the city name so a trip
 * always looks the same. Deep shade first (for text contrast), light shade second.
 */
const DESTINATION_PALETTES: [string, string][] = [
  ['#001F65', '#6895FD'], // brand navy to periwinkle
  ['#083B47', '#2FA6A0'], // lagoon
  ['#5A1E3A', '#E27A8F'], // dusk
  ['#34195E', '#9B7BEA'], // plum
  ['#163F2A', '#5DBA82'], // forest
  ['#62290B', '#EE9B52'], // desert
];

export function destinationColors(location: string): [string, string] {
  const city = (location || '').split(',')[0].trim().toLowerCase();
  let hash = 0;
  for (const ch of city) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return DESTINATION_PALETTES[hash % DESTINATION_PALETTES.length];
}

export function splitPlace(location: string) {
  const [city, ...rest] = (location || '').split(',').map((part) => part.trim());
  return { city: city || location, region: rest.join(', ') };
}

export type TripStatus =
  | { kind: 'underway'; day: number; days: number }
  | { kind: 'upcoming'; daysAway: number }
  | { kind: 'past' }
  | { kind: 'undated' };

export function tripStatus(trip: { startDate?: string | null; endDate?: string | null; days: number }, now = new Date()): TripStatus {
  if (!trip.startDate) return { kind: 'undated' };
  const start = parseISO(trip.startDate);
  const end = trip.endDate ? parseISO(trip.endDate) : start;
  const fromStart = differenceInCalendarDays(now, start);
  if (fromStart < 0) return { kind: 'upcoming', daysAway: -fromStart };
  if (differenceInCalendarDays(now, end) > 0) return { kind: 'past' };
  return { kind: 'underway', day: fromStart + 1, days: trip.days };
}

/** Underway first, then soonest upcoming, then trips without dates, then past trips (latest first). */
export function sortTrips<T extends { startDate?: string | null; endDate?: string | null; days: number; createdAt?: string }>(trips: T[]) {
  const rank = (t: T) => ({ underway: 0, upcoming: 1, undated: 2, past: 3 })[tripStatus(t).kind];
  return [...trips].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff) return diff;
    const sa = a.startDate ? parseISO(a.startDate).getTime() : 0;
    const sb = b.startDate ? parseISO(b.startDate).getTime() : 0;
    if (tripStatus(a).kind === 'past') return sb - sa;
    if (tripStatus(a).kind === 'undated') return (b.createdAt || '').localeCompare(a.createdAt || '');
    return sa - sb;
  });
}
