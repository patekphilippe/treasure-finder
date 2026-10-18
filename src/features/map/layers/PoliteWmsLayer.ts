import L from 'leaflet';
import { createLimiter, type Limiter } from '@/shared/lib/async/createLimiter';

export interface PoliteWmsOptions extends L.WMSOptions {
  /** requests in flight to this host at once */
  maxParallel?: number;
}

/** pauses before each retry; a busy ArcGIS server answers 400 and then serves the same tile */
const RETRY_DELAYS_MS = [800, 2000, 4000];

/** a request that hangs longer than this frees its slot and counts as failed */
const LOAD_TIMEOUT_MS = 30_000;

const limiters = new Map<string, Limiter>();

function hostLimiter(url: string, max: number): Limiter {
  const key = `${new URL(url, location.href).host}|${max}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = createLimiter(max);
    limiters.set(key, limiter);
  }
  return limiter;
}

/**
 * WMS for slow public servers: a few requests at a time per host, and failed tiles retried.
 * Plain L.TileLayer.WMS fires every tile at once and leaves a hole when one fails.
 */
export class PoliteWmsLayer extends L.TileLayer.WMS {
  private readonly limit: Limiter;

  constructor(url: string, options: PoliteWmsOptions) {
    super(url, options);
    this.limit = hostLimiter(url, options.maxParallel ?? 6);
  }

  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const img = document.createElement('img');
    img.alt = '';
    img.setAttribute('role', 'presentation');
    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      img.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }
    const url = this.getTileUrl(coords);

    const attempt = (n: number): Promise<boolean> =>
      this.limit(() => this.loadInto(img, n === 0 ? url : `${url}&_retry=${n}`)).then((ok) => {
        if (ok || n >= RETRY_DELAYS_MS.length || !img.isConnected) return ok;
        return new Promise<boolean>((r) => setTimeout(r, RETRY_DELAYS_MS[n])).then(() =>
          attempt(n + 1),
        );
      });

    // start after Leaflet has put the tile in the DOM, so pruned tiles can be skipped
    queueMicrotask(() =>
      void attempt(0).then((ok) =>
        done(ok ? undefined : new Error(`WMS tile failed: ${url}`), img),
      ),
    );
    return img;
  }

  private loadInto(img: HTMLImageElement, src: string): Promise<boolean> {
    // tile scrolled away while waiting in the queue
    if (!img.isConnected) return Promise.resolve(false);
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
}
