import { useEffect, useState } from 'react';

/**
 * Photos of places, taken from the lead image of their Wikipedia article: one per trip
 * destination and one per stop in a day's plan. Looked up in the browser (the MediaWiki
 * API allows cross-origin reads with origin=*) and cached, so each place is fetched once.
 */
export interface PlacePhoto {
  url: string;
  /** Wikimedia file page, where the photographer and license are listed. */
  creditUrl: string;
}

const API = 'https://en.wikipedia.org/w/api.php';
const CACHE_PREFIX = 'wheretwo:photo:';
const CACHE_DAYS = 30;

// Lead images that aren't photos of the place: maps, flags, seals, logos, diagrams.
const NOT_A_PHOTO = /\.svg$|\.gif$|flag|map|locator|location|coat[_ ]of[_ ]arms|seal|logo|emblem|marker|montage|collage/i;

// Words that say what kind of place something is rather than which place it is.
const KIND_WORDS = new Set([
  'the', 'and', 'of', 'de', 'la', 'le', 'el', 'del', 'temple', 'shrine', 'palace', 'museum', 'market', 'park',
  'garden', 'gardens', 'tower', 'station', 'street', 'square', 'restaurant', 'cafe', 'bar', 'ramen', 'sushi',
  'beach', 'church', 'cathedral', 'castle', 'bridge', 'hotel', 'district', 'tour', 'visit', 'walk', 'center', 'centre',
]);

interface WikiPage {
  title: string;
  missing?: boolean;
  pageimage?: string;
  thumbnail?: { source: string; width: number; height: number };
  pageprops?: { disambiguation?: string };
  index?: number;
}

function words(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
}

function toPhoto(page: WikiPage | undefined, landscapeOnly: boolean): PlacePhoto | null {
  if (!page || page.missing || page.pageprops?.disambiguation !== undefined) return null;
  if (!page.thumbnail || !page.pageimage || NOT_A_PHOTO.test(page.pageimage)) return null;
  if (landscapeOnly && page.thumbnail.width < page.thumbnail.height) return null;
  return {
    url: page.thumbnail.source,
    creditUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`,
  };
}

async function query(params: Record<string, string>, size: number): Promise<WikiPage[]> {
  const search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1',
    prop: 'pageimages|pageprops', piprop: 'thumbnail|name', pithumbsize: String(size), ...params,
  });
  const response = await fetch(`${API}?${search}`);
  if (!response.ok) return [];
  const data = await response.json();
  const pages: WikiPage[] = data?.query?.pages ?? [];
  return [...pages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/** A trip's destination: "Portland, Oregon" first (finds the right Portland), then the city alone. */
async function lookUpDestination(location: string): Promise<PlacePhoto | null> {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  const city = parts[0];
  if (!city) return null;
  const titles = parts.length > 1 ? [`${city}, ${parts[1]}`, city] : [city];
  for (const title of titles) {
    const photo = toPhoto((await query({ titles: title }, 1280))[0], true);
    if (photo) return photo;
  }
  // The lead image is a map or flag (Bali's is a map marker): try related articles.
  for (const page of await query({ generator: 'search', gsrsearch: parts.join(' '), gsrlimit: '6' }, 1280)) {
    const photo = toPhoto(page, true);
    if (photo) return photo;
  }
  return null;
}

/**
 * One stop in a day's plan, e.g. "Senso-ji Temple" in Tokyo. An exact article title wins
 * ("Trevi Fountain"); otherwise a search, accepting a result only when its title shares
 * a distinctive word with the stop's name, so "Asakusa Naniwaya" doesn't get a painting.
 */
async function lookUpStop(name: string, place: string, neighborhood = ''): Promise<PlacePhoto | null> {
  const exact = toPhoto((await query({ titles: name }, 250))[0], false);
  if (exact) return exact;

  // "Ichiran Ramen Shibuya" shouldn't match the Shibuya article: ignore the city and neighborhood.
  const placeWords = new Set(words(`${place} ${neighborhood}`));
  const distinctive = words(name).filter((w) => !KIND_WORDS.has(w) && !placeWords.has(w));
  if (distinctive.length === 0) return null;
  const city = place.split(',')[0];
  for (const page of await query({ generator: 'search', gsrsearch: `${name} ${city}`, gsrlimit: '3' }, 250)) {
    const titleWords = new Set(words(page.title));
    if (!distinctive.some((w) => titleWords.has(w))) continue;
    const photo = toPhoto(page, false);
    if (photo) return photo;
  }
  return null;
}

// ─── Caching ─────────────────────────────────────────────────────────────────

const inFlight = new Map<string, Promise<PlacePhoto | null>>();

function readCache(key: string): PlacePhoto | null | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { photo, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_DAYS * 86_400_000) return undefined;
    return photo;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, photo: PlacePhoto | null) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ photo, savedAt: Date.now() }));
  } catch { /* storage full or blocked: the photo just won't be remembered */ }
}

function cachedLookup(key: string, lookUp: () => Promise<PlacePhoto | null>): Promise<PlacePhoto | null> {
  const cached = readCache(key);
  if (cached !== undefined) return Promise.resolve(cached);
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      lookUp()
        .then((photo) => { writeCache(key, photo); return photo; })
        .catch(() => null) // offline or blocked: show the fallback now, try again next visit
        .finally(() => inFlight.delete(key)),
    );
  }
  return inFlight.get(key)!;
}

function usePhoto(key: string | null, lookUp: () => Promise<PlacePhoto | null>) {
  const [photo, setPhoto] = useState<PlacePhoto | null | undefined>(() => (key ? readCache(key) : null));
  useEffect(() => {
    if (!key) { setPhoto(null); return; }
    let active = true;
    setPhoto(readCache(key));
    cachedLookup(key, lookUp).then((result) => { if (active) setPhoto(result); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return photo;
}

/** The trip destination's photo. `undefined` while loading, `null` when there's no usable photo. */
export function usePlacePhoto(location: string | undefined) {
  const key = location?.trim() ? `place:${location.trim().toLowerCase()}` : null;
  return usePhoto(key, () => lookUpDestination(location!));
}

/** A stop's photo, looked up by its name within the trip's destination. */
export function useStopPhoto(name: string | undefined, place: string, neighborhood?: string) {
  const key = name?.trim() ? `stop:${place.trim().toLowerCase()}:${name.trim().toLowerCase()}` : null;
  return usePhoto(key, () => lookUpStop(name!, place, neighborhood));
}
