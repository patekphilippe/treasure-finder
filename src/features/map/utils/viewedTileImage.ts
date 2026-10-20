import type { Limiter } from '@/shared/lib/async/createLimiter';
import { loadImage } from './loadImage';

/** Cache Storage of tiles seen on slow historical map servers: personal use, never an area download. */
export const VIEWED_TILES_CACHE = 'mapa-ogladane-mapy';
/** ~250 scan tiles of ~200 KB: some 50 MB, the last dozen or so screens */
const MAX_STORED = 250;
/** a busy ArcGIS server answers an error (or XML) and then serves the same tile */
const RETRY_DELAYS_MS = [800, 2000, 4000];
const FETCH_TIMEOUT_MS = 30_000;
/** decoded images kept for tiles drawn again soon (neighbouring map tiles share them) */
const MAX_IN_MEMORY = 150;

interface Pending {
  image: Promise<HTMLImageElement | null>;
  /** map tiles waiting for it: when none is on the map any more, the request is skipped */
  wanted: Set<() => boolean>;
}
const inMemory = new Map<string, Pending>();
let putsSinceTrim = 0;

async function openCache(): Promise<Cache | null> {
  try {
    return 'caches' in globalThis ? await caches.open(VIEWED_TILES_CACHE) : null;
  } catch {
    return null;
  }
}

async function trim(cache: Cache): Promise<void> {
  if (++putsSinceTrim < 25) return;
  putsSinceTrim = 0;
  const keys = await cache.keys();
  // keys come in insertion order: the oldest go first
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_STORED))) await cache.delete(k);
}

async function fetchBlob(url: string, limit: Limiter, entry: Pending): Promise<Blob | null> {
  const isWanted = () => [...entry.wanted].some((alive) => alive());
  const cache = await openCache();
  const hit = await cache?.match(url).catch(() => undefined);
  if (hit) return hit.blob();
  for (let n = 0; n <= RETRY_DELAYS_MS.length; n++) {
    if (n) await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[n - 1]));
    if (!isWanted()) return null;
    const res = await limit(() =>
      isWanted()
        ? fetch(url, { mode: 'cors', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch(
            () => null,
          )
        : Promise.resolve(null),
    );
    if (res?.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) {
      const blob = await res.blob();
      if (cache)
        void cache
          .put(url, new Response(blob, { headers: { 'content-type': blob.type } }))
          .then(() => trim(cache))
          .catch(() => undefined);
      return blob;
    }
  }
  return null;
}

/**
 * One tile of a slow historical map server as an image: from memory, then from the phone's
 * cache of recently seen tiles, then from the server through its host queue with retries.
 * Map tiles sharing a source tile wait for the same request.
 */
export function viewedTileImage(
  url: string,
  limit: Limiter,
  alive: () => boolean,
): Promise<HTMLImageElement | null> {
  const known = inMemory.get(url);
  if (known) {
    known.wanted.add(alive);
    return known.image;
  }
  const entry: Pending = { image: Promise.resolve(null), wanted: new Set([alive]) };
  entry.image = fetchBlob(url, limit, entry).then(async (blob) => {
    if (!blob) {
      // failed or no longer needed: the next view asks again
      inMemory.delete(url);
      return null;
    }
    const objectUrl = URL.createObjectURL(blob);
    const img = await loadImage(objectUrl);
    URL.revokeObjectURL(objectUrl);
    entry.wanted.clear();
    return img;
  });
  inMemory.set(url, entry);
  if (inMemory.size > MAX_IN_MEMORY) inMemory.delete(inMemory.keys().next().value!);
  return entry.image;
}
