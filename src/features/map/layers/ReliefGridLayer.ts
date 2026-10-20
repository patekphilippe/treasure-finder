import L from 'leaflet';
import type { Limiter } from '@/shared/lib/async/createLimiter';
import type { Wmts2180Source } from '@/shared/lib/tiles';
import { drawWmts2180Tile } from '../utils/drawWmts2180Tile';
import { hostLimiter } from '../utils/hostLimiter';
import { politeTileLoad } from '../utils/politeTileLoad';

export interface ReliefGridOptions extends L.GridLayerOptions {
  /** XYZ template of our tiles (512 px each) */
  url: string;
  /** our tiles start at this zoom; below only the stand-in is drawn */
  firstZoom: number;
  /** the Geoportal shading, drawn while our tile is still being rendered */
  standIn: Wmts2180Source;
  maxParallel?: number;
}

/** our tile not here by then (first request of an area): the stand-in is drawn meanwhile */
const STAND_IN_AFTER_MS = 1200;
/** our tiles have twice the pixels of a 256 px map tile */
const DENSITY = 2;

/**
 * Our hillshade tiles from the backend with the Geoportal shading as a stand-in: a tile already
 * rendered on the server arrives in a fraction of a second; one asked for the first time takes
 * the server a few seconds, so the Geoportal tiles are drawn meanwhile and replaced as soon as
 * ours comes. Never slower than the Geoportal layer alone, much lighter once an area is warm.
 */
export class ReliefGridLayer extends L.GridLayer {
  private readonly relief: ReliefGridOptions;
  private readonly limit: Limiter;

  constructor(options: ReliefGridOptions) {
    super(options);
    this.relief = options;
    this.limit = hostLimiter(options.url, options.maxParallel ?? 8);
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const size = this.getTileSize();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * DENSITY;
    canvas.height = size.y * DENSITY;
    const ctx = canvas.getContext('2d')!;
    const map = (this as unknown as { _map: L.Map })._map;
    let oursShown = false;
    let standIn: Promise<void> | null = null;
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      done(error, canvas);
    };
    const drawStandIn = () => {
      standIn ??= drawWmts2180Tile(ctx, map, coords, size, DENSITY, this.relief.standIn, {
        isCurrent: () => !oursShown,
      });
      return standIn;
    };

    if (coords.z < this.relief.firstZoom) {
      void drawStandIn().then(() => finish());
      return canvas;
    }
    const timer = setTimeout(() => {
      if (canvas.isConnected && !oursShown) void drawStandIn().then(() => finish());
    }, STAND_IN_AFTER_MS);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url = L.Util.template(this.relief.url, { z: coords.z, x: coords.x, y: coords.y });
    // start after Leaflet has put the tile in the DOM, so pruned tiles can be skipped
    queueMicrotask(
      () =>
        void politeTileLoad(img, url, this.limit, () => canvas.isConnected).then((ok) => {
          clearTimeout(timer);
          if (ok) {
            oursShown = true;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            finish();
          } else if (canvas.isConnected) {
            void drawStandIn().then(() => finish());
          } else finish(new Error(`Relief tile failed: ${url}`));
        }),
    );
    return canvas;
  }
}
