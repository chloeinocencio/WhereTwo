import { parseISO, differenceInCalendarDays } from 'date-fns';

// Shared by the trips list and the trip page (and mirrored in the iOS app's Theme.swift).

export const INK = '#0E1F4D';
export const SLATE = '#5B6B8C';
export const MIST = '#DDE4F3';
export const PAPER = '#F4F6FB';
export const TODAY = '#F5A524';

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
