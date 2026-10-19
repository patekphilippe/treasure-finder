import L from 'leaflet';
import { getProj4 } from '@/shared/lib/geo/crs';
import type { Limiter } from '@/shared/lib/async/createLimiter';
import { hostLimiter } from '../utils/hostLimiter';
import { loadImage } from '../utils/loadImage';
import { coversView, viewRequest2180, type ViewRequest } from '../utils/viewRequest2180';
import { Image2180GridLayer } from './Image2180GridLayer';

export interface Wms2180ViewOptions extends L.GridLayerOptions {
  url: string;
  layers: string;
  params?: Record<string, string>;
  maxParallel?: number;
  /** e.g. image/png8: same look as PNG for scans, a third of the size and twice as fast */
  format?: string;
}

const OPTIONS = { margin: 0.2, maxSide: 2048, minRes: 1 };
/** wait for the map to settle before asking: a fly-to passes many zooms */
const SETTLE_MS = 250;
const RETRY_DELAYS_MS = [1000, 2500, 5000];
/** the quick first image: 3× coarser, ~1/9 of the pixels, there in a second or two */
const PREVIEW_FACTOR = 3;

/**
 * A slow WMS asked once per view instead of once per tile: one EPSG:2180 image of the screen
 * (plus a margin) when the map stops, warped like Image2180GridLayer. The previous image stays
 * until the next arrives, so moving the map never shows holes. Used for the Lower Silesian
 * geoportal, where 100+ tile requests a view took ~40 s and were partly refused.
 */
export class Wms2180ViewLayer extends Image2180GridLayer {
  private readonly wms: Wms2180ViewOptions;
  private readonly limit: Limiter;
  private shown: ViewRequest | null = null;
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** stand-in tile so the map's loading bar counts this image like a tile */
  private readonly marker = document.createElement('div');

  constructor(options: Wms2180ViewOptions) {
    super(null, options);
    this.wms = options;
    this.limit = hostLimiter(options.url, options.maxParallel ?? 3);
  }

  override onAdd(map: L.Map): this {
    super.onAdd(map);
    map.on('moveend', this.schedule, this);
    this.schedule();
    return this;
  }

  override onRemove(map: L.Map): this {
    map.off('moveend', this.schedule, this);
    clearTimeout(this.timer);
    this.seq++;
    this.fire('tileabort', { tile: this.marker, coords: null });
    return super.onRemove(map);
  }

  private schedule(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.refresh(), SETTLE_MS);
  }

  private async refresh(): Promise<void> {
    const map = (this as unknown as { _map?: L.Map })._map;
    if (!map) return;
    if (this.wms.minZoom !== undefined && map.getZoom() < this.wms.minZoom) return;
    const size = map.getSize();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const proj = getProj4();
    const corners = [
      [0, 0],
      [size.x, 0],
      [0, size.y],
      [size.x, size.y],
    ].map(([x, y]) => {
      const ll = map.containerPointToLatLng([x!, y!]);
      const [e, n] = proj('EPSG:4326', 'EPSG:2180', [ll.lng, ll.lat]) as [number, number];
      return { x: e, y: n };
    });
    const want = viewRequest2180(corners, size.x * dpr, size.y * dpr, OPTIONS);
    if (coversView(this.shown, want, OPTIONS.margin)) return;

    const seq = ++this.seq;
    this.fire('tileloadstart', { tile: this.marker, coords: null });
    // a sharp image takes the server several seconds: show a coarse one meanwhile
    let sharpShown = false;
    const preview: ViewRequest = {
      ...want,
      res: want.res * PREVIEW_FACTOR,
      w: Math.max(1, Math.round(want.w / PREVIEW_FACTOR)),
      h: Math.max(1, Math.round(want.h / PREVIEW_FACTOR)),
    };
    const fresh = !coversView(this.shown, { ...want, res: preview.res }, OPTIONS.margin);
    if (fresh)
      void this.fetchImage(preview, seq).then((img) => {
        if (img && !sharpShown && seq === this.seq)
          this.setSource({
            image: img,
            originE: preview.originE,
            originN: preview.originN,
            res: preview.res,
          });
      });
    const img = await this.fetchImage(want, seq);
    // a newer view was asked meanwhile: that request reports the end of loading
    if (seq !== this.seq) return;
    if (img) {
      sharpShown = true;
      this.shown = want;
      this.setSource({ image: img, originE: want.originE, originN: want.originN, res: want.res });
      this.fire('tileload', { tile: this.marker, coords: null });
    } else {
      this.fire('tileerror', {
        tile: this.marker,
        coords: null,
        error: new Error('WMS view failed'),
      });
    }
  }

  /** One GetMap of `r`, retried while the server refuses; null when it keeps failing or is stale. */
  private async fetchImage(r: ViewRequest, seq: number): Promise<HTMLImageElement | null> {
    const query = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: this.wms.layers,
      STYLES: '',
      CRS: 'EPSG:2180',
      // WMS 1.3.0 axis order for EPSG:2180: northing, easting
      BBOX: [r.originN - r.h * r.res, r.originE, r.originN, r.originE + r.w * r.res]
        .map((v) => v.toFixed(2))
        .join(','),
      WIDTH: String(r.w),
      HEIGHT: String(r.h),
      FORMAT: this.wms.format ?? 'image/png',
      TRANSPARENT: 'true',
      ...this.wms.params,
    });
    const url = `${this.wms.url}?${query.toString()}`;
    let img: HTMLImageElement | null = null;
    for (let n = 0; n <= RETRY_DELAYS_MS.length && !img && seq === this.seq; n++) {
      if (n) await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[n - 1]));
      if (seq !== this.seq) break;
      img = await this.limit(() => loadImage(n ? `${url}&_retry=${n}` : url));
    }
    return seq === this.seq ? img : null;
  }
}
