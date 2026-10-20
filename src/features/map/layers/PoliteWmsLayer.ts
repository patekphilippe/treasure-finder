import L from 'leaflet';
import type { Limiter } from '@/shared/lib/async/createLimiter';
import { hostLimiter } from '../utils/hostLimiter';
import { politeTileLoad } from '../utils/politeTileLoad';

export interface PoliteWmsOptions extends L.WMSOptions {
  /** requests in flight to this host at once */
  maxParallel?: number;
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
    // start after Leaflet has put the tile in the DOM, so pruned tiles can be skipped
    queueMicrotask(
      () =>
        void politeTileLoad(img, url, this.limit).then((ok) =>
          done(ok ? undefined : new Error(`WMS tile failed: ${url}`), img),
        ),
    );
    return img;
  }
}
