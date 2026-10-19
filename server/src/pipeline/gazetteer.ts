import type { ViewBbox } from '@/shared/types/sources';
import { sha256Hex } from '../crypto';
import type { LatLng } from './georef';

export interface Place extends LatLng {
  name: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
// Nominatim usage policy: identify the app, at most one request a second, cache results
const USER_AGENT = 'treasure-finder/1.0 (+https://github.com/patekphilippe/treasure-finder)';
const CACHE_DAYS = 90;
let lastCall = 0;

/** "Ober-Schreiberhau" and "ober schreiberhau" compare equal; Fraktur ß, long s and umlauts too. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ſ/g, 's')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Places with this name (also old and German names) inside `bbox`, from OpenStreetMap,
 * cached in D1. Empty when nothing matches or the service is unreachable.
 */
export async function findPlaces(
  db: D1Database,
  name: string,
  bbox: ViewBbox,
  now: number,
): Promise<Place[]> {
  const q = normalizeName(name);
  if (q.length < 3) return [];
  const viewbox = [bbox.west, bbox.north, bbox.east, bbox.south].map((v) => v.toFixed(3)).join(',');
  const key = await sha256Hex(`${q}|${viewbox}`);
  const cached = await db
    .prepare('SELECT json, fetched_at FROM gazetteer_cache WHERE query = ?')
    .bind(key)
    .first<{ json: string; fetched_at: number }>();
  if (cached && now - cached.fetched_at < CACHE_DAYS * 86_400_000)
    return JSON.parse(cached.json) as Place[];

  const wait = lastCall + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  const url = `${NOMINATIM}?${new URLSearchParams({
    q: name,
    format: 'jsonv2',
    viewbox,
    bounded: '1',
    limit: '5',
    'accept-language': 'pl',
  })}`;
  let places: Place[] = [];
  try {
    const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
    if (!res.ok) return [];
    const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    places = rows.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lon),
      name: r.display_name.split(',')[0] ?? '',
    }));
  } catch {
    return [];
  }
  await db
    .prepare('INSERT OR REPLACE INTO gazetteer_cache (query, json, fetched_at) VALUES (?, ?, ?)')
    .bind(key, JSON.stringify(places), now)
    .run();
  return places;
}

/** Bbox grown by `km` on every side (search area around the sender's view or a sheet). */
export function growBbox(b: ViewBbox, km: number): ViewBbox {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((((b.south + b.north) / 2) * Math.PI) / 180));
  return { south: b.south - dLat, north: b.north + dLat, west: b.west - dLng, east: b.east + dLng };
}
