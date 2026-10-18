import { AREA_CACHE_PREFIX, AREA_META_KEY } from '../config/offlineAreas';
import type { OfflineArea } from '../types';

/** Downloaded areas, newest first, read from their caches. */
export async function listAreas(): Promise<OfflineArea[]> {
  if (!('caches' in globalThis)) return [];
  const names = (await caches.keys()).filter((n) => n.startsWith(AREA_CACHE_PREFIX));
  const areas = await Promise.all(
    names.map(async (n) => {
      const res = await (await caches.open(n)).match(AREA_META_KEY);
      return res ? ((await res.json()) as OfflineArea) : null;
    }),
  );
  return areas
    .filter((a): a is OfflineArea => a !== null)
    .sort((a, b) => b.created.localeCompare(a.created));
}
