import { useEffect, useState } from 'react';

/**
 * A photo of a trip's destination, taken from the lead image of its Wikipedia article.
 * Looked up in the browser (the MediaWiki API allows cross-origin reads with origin=*)
 * and cached per destination, so each place is fetched once.
 */
export interface PlacePhoto {
  url: string;
  /** Wikimedia file page, where the photographer and license are listed. */
  creditUrl: string;
}

const API = 'https://en.wikipedia.org/w/api.php';
const CACHE_PREFIX = 'wheretwo:place-photo:';
const CACHE_DAYS = 30;

// Lead images that aren't photos of the place: maps, flags, seals, diagrams.
const NOT_A_PHOTO = /\.svg$|\.gif$|flag|map|locator|location|coat[_ ]of[_ ]arms|seal|logo|emblem|marker|montage|collage/i;

const inFlight = new Map<string, Promise<PlacePhoto | null>>();

interface WikiPage {
  title: string;
  missing?: string;
  pageimage?: string;
  thumbnail?: { source: string; width: number; height: number };
  pageprops?: Record<string, string>;
  index?: number;
}

function usable(page: WikiPage | undefined): PlacePhoto | null {
  if (!page || 'missing' in page || page.pageprops?.disambiguation !== undefined) return null;
  if (!page.thumbnail || !page.pageimage || NOT_A_PHOTO.test(page.pageimage)) return null;
  if (page.thumbnail.width < page.thumbnail.height) return null; // portrait shots crop badly in wide headers
  return {
    url: page.thumbnail.source,
    creditUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`,
  };
}

async function query(params: Record<string, string>): Promise<WikiPage[]> {
  const search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1',
    prop: 'pageimages|pageprops', piprop: 'thumbnail|name', pithumbsize: '1280', ...params,
  });
  const response = await fetch(`${API}?${search}`);
  if (!response.ok) return [];
  const data = await response.json();
  const pages: WikiPage[] = data?.query?.pages ?? [];
  return [...pages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

async function lookUp(location: string): Promise<PlacePhoto | null> {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  const city = parts[0];
  if (!city) return null;

  // "Portland, Oregon" finds the right Portland; "Tokyo, Japan" redirects to Tokyo.
  const titles = parts.length > 1 ? [`${city}, ${parts[1]}`, city] : [city];
  for (const title of titles) {
    const [page] = await query({ titles: title });
    const photo = usable(page);
    if (photo) return photo;
  }

  // The article's lead image is a map or flag (Bali is a map marker): try related articles.
  const results = await query({ generator: 'search', gsrsearch: `${city} ${parts.slice(1).join(' ')}`.trim(), gsrlimit: '6' });
  for (const page of results) {
    const photo = usable(page);
    if (photo) return photo;
  }
  return null;
}

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

export function getPlacePhoto(location: string): Promise<PlacePhoto | null> {
  const key = location.trim().toLowerCase();
  const cached = readCache(key);
  if (cached !== undefined) return Promise.resolve(cached);
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      lookUp(location)
        .then((photo) => { writeCache(key, photo); return photo; })
        .catch(() => null) // offline or blocked: show the fallback, try again next visit
        .finally(() => inFlight.delete(key)),
    );
  }
  return inFlight.get(key)!;
}

/** `undefined` while loading, `null` when there's no usable photo. */
export function usePlacePhoto(location: string | undefined) {
  const [photo, setPhoto] = useState<PlacePhoto | null | undefined>(() =>
    location ? readCache(location.trim().toLowerCase()) : null,
  );
  useEffect(() => {
    if (!location) { setPhoto(null); return; }
    let active = true;
    getPlacePhoto(location).then((result) => { if (active) setPhoto(result); });
    return () => { active = false; };
  }, [location]);
  return photo;
}
