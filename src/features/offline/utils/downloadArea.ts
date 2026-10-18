import { AREA_CACHE_PREFIX, AREA_META_KEY, DOWNLOAD_CONCURRENCY } from '../config/offlineAreas';
import type { OfflineArea } from '../types';

export interface DownloadResult {
  bytes: number;
  failed: number;
}

/**
 * Fetches the tiles into the area's own cache, a few at a time. Tiles that fail are counted,
 * not retried; an abort stops the download and removes what was saved.
 */
export async function downloadArea(
  area: Omit<OfflineArea, 'bytes' | 'failed'>,
  urls: readonly string[],
  onProgress: (done: number) => void,
  signal: AbortSignal,
): Promise<DownloadResult> {
  const cacheName = AREA_CACHE_PREFIX + area.id;
  const cache = await caches.open(cacheName);
  let next = 0;
  let done = 0;
  let bytes = 0;
  let failed = 0;

  const worker = async () => {
    while (next < urls.length && !signal.aborted) {
      const url = urls[next++]!;
      try {
        const res = await fetch(url, { mode: 'cors', signal });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        bytes += blob.size;
        await cache.put(url, new Response(blob, { headers: res.headers }));
      } catch {
        if (!signal.aborted) failed++;
      }
      onProgress(++done);
    }
  };
  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));

  if (signal.aborted) {
    await caches.delete(cacheName);
    throw new DOMException('Pobieranie przerwane', 'AbortError');
  }
  const meta: OfflineArea = { ...area, bytes, failed };
  await cache.put(
    AREA_META_KEY,
    new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }),
  );
  return { bytes, failed };
}
