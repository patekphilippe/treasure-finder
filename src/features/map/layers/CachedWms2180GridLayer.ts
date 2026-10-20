import L from 'leaflet';
import type { Limiter } from '@/shared/lib/async/createLimiter';
import type { Wmts2180Source } from '@/shared/lib/tiles';
import { drawWmts2180Tile } from '../utils/drawWmts2180Tile';
import { hostLimiter } from '../utils/hostLimiter';
import { viewedTileImage } from '../utils/viewedTileImage';
import { wms2180GridSource, type Wms2180Request } from '../utils/wms2180GridSource';

export interface CachedWms2180Options extends L.GridLayerOptions, Wms2180Request {
  /** requests in flight to this host at once (the Lower Silesian geoportal refuses more than 3) */
  maxParallel?: number;
}

/** scans need no retina sharpness, and fewer source tiles load faster */
const MAX_DPR = 1.5;

/**
 * A slow historical WMS in EPSG:2180 (Lower Silesian Messtischblatt): fixed 512 px grid tiles
 * warped onto the map, a few requests at a time with retries, and tiles already seen kept on
 * the phone (viewedTileImage), so panning back or returning to a place shows them at once.
 */
export class CachedWms2180GridLayer extends L.GridLayer {
  private readonly source: Wmts2180Source;
  private readonly limit: Limiter;

  constructor(options: CachedWms2180Options) {
    super(options);
    this.source = wms2180GridSource(options);
    this.limit = hostLimiter(options.url, options.maxParallel ?? 3);
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const size = this.getTileSize();
    const dpr = Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size.x * dpr);
    canvas.height = Math.round(size.y * dpr);
    const map = (this as unknown as { _map: L.Map })._map;
    const alive = () => canvas.isConnected;
    // start after Leaflet has put the tile in the DOM, so pruned tiles can be skipped
    queueMicrotask(
      () =>
        void drawWmts2180Tile(canvas.getContext('2d')!, map, coords, size, dpr, this.source, {
          load: (url) => viewedTileImage(url, this.limit, alive),
        }).then(() => done(undefined, canvas)),
    );
    return canvas;
  }
}
