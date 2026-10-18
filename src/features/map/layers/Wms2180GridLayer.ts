import L from 'leaflet';
import type { Limiter } from '@/shared/lib/async/createLimiter';
import { canvasDpr, metresToTilePixels, projectedImageTransform } from '@/shared/lib/tiles';
import { hostLimiter } from '../utils/hostLimiter';
import { loadImage } from '../utils/loadImage';
import { tileCorners2180 } from '../utils/tileCorners2180';

export interface Wms2180Options extends L.GridLayerOptions {
  url: string;
  layers: string;
  /** extra GetMap parameters, e.g. TIME */
  params?: Record<string, string>;
  maxParallel?: number;
}

/** pauses before each retry; a busy ArcGIS server answers 400 and then serves the same tile */
const RETRY_DELAYS_MS = [800, 2000, 4000];

/**
 * A WMS asked in EPSG:2180 and warped onto each map tile like the NMT hillshade. For services
 * whose own Web Mercator output is misplaced (the Lower Silesian Messtischblatt: ~150 m), the
 * EPSG:2180 image is the correctly placed one.
 */
export class Wms2180GridLayer extends L.GridLayer {
  private readonly wms: Wms2180Options;
  private readonly limit: Limiter;

  constructor(options: Wms2180Options) {
    super(options);
    this.wms = options;
    this.limit = hostLimiter(options.url, options.maxParallel ?? 6);
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    const map = (this as unknown as { _map: L.Map })._map;
    const [p0, p1, p2, p3] = tileCorners2180(map, coords, size);
    const minE = Math.min(p0.x, p1.x, p2.x, p3.x);
    const maxE = Math.max(p0.x, p1.x, p2.x, p3.x);
    const minN = Math.min(p0.y, p1.y, p2.y, p3.y);
    const maxN = Math.max(p0.y, p1.y, p2.y, p3.y);
    // square pixels covering the tile's EPSG:2180 box at screen sharpness
    const res = Math.max(maxE - minE, maxN - minN) / (size.x * dpr);
    const w = Math.ceil((maxE - minE) / res);
    const h = Math.ceil((maxN - minN) / res);
    const query = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: this.wms.layers,
      STYLES: '',
      CRS: 'EPSG:2180',
      // WMS 1.3.0 axis order for EPSG:2180: northing, easting
      BBOX: [maxN - h * res, minE, maxN, minE + w * res].map((v) => v.toFixed(2)).join(','),
      WIDTH: String(w),
      HEIGHT: String(h),
      FORMAT: 'image/png',
      TRANSPARENT: 'true',
      ...this.wms.params,
    });
    const url = `${this.wms.url}?${query.toString()}`;

    const attempt = (n: number): Promise<HTMLImageElement | null> =>
      this.limit(() =>
        canvas.isConnected || n === 0
          ? loadImage(n ? `${url}&_retry=${n}` : url)
          : Promise.resolve(null),
      ).then((img) => {
        if (img || n >= RETRY_DELAYS_MS.length || !canvas.isConnected) return img;
        return new Promise<void>((r) => setTimeout(r, RETRY_DELAYS_MS[n])).then(() =>
          attempt(n + 1),
        );
      });

    queueMicrotask(() => {
      void attempt(0).then((img) => {
        if (img) {
          const t = projectedImageTransform(
            metresToTilePixels(p0, p1, p2, size.x),
            minE,
            maxN,
            res,
            dpr,
          );
          const ctx = canvas.getContext('2d')!;
          ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
          ctx.drawImage(img, 0, 0, w, h);
        }
        done(img ? undefined : new Error(`WMS tile failed: ${url}`), canvas);
      });
    });
    return canvas;
  }
}
