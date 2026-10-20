import type { Limiter } from '@/shared/lib/async/createLimiter';

/** pauses before each retry; a busy server answers an error and then serves the same tile */
const RETRY_DELAYS_MS = [800, 2000, 4000];

/** a request that hangs longer than this frees its slot and counts as failed */
const LOAD_TIMEOUT_MS = 30_000;

function loadInto(img: HTMLImageElement, src: string, alive: () => boolean): Promise<boolean> {
  // tile scrolled away while waiting in the queue
  if (!alive()) return Promise.resolve(false);
  return new Promise((resolve) => {
    // listeners, not onload/onerror: Leaflet overwrites those when it aborts tiles on zoom,
    // and a promise that never settles would hold its queue slot forever
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve(ok);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = src;
  });
}

/**
 * Loads a map tile into `img` through the host's queue, retrying a few times when it fails.
 * Resolves false when every attempt failed or the tile left the map meanwhile (`alive`: by
 * default the image is still in the page; a canvas tile passes its own check).
 */
export function politeTileLoad(
  img: HTMLImageElement,
  url: string,
  limit: Limiter,
  alive: () => boolean = () => img.isConnected,
): Promise<boolean> {
  const attempt = (n: number): Promise<boolean> =>
    limit(() =>
      loadInto(img, n === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}_retry=${n}`, alive),
    ).then((ok) => {
      if (ok || n >= RETRY_DELAYS_MS.length || !alive()) return ok;
      return new Promise<boolean>((r) => setTimeout(r, RETRY_DELAYS_MS[n])).then(() =>
        attempt(n + 1),
      );
    });
  return attempt(0);
}
