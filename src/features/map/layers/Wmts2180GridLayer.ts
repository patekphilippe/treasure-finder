import L from 'leaflet';
import { NMT_WMTS_2180 } from '@/shared/config/geoportalWmts2180';
import {
  chooseLevel,
  metresToTilePixels,
  projectedImageTransform,
  sourceTileRange,
} from '@/shared/lib/tiles';
import { tileCorners2180 } from '../utils/tileCorners2180';

type Config = typeof NMT_WMTS_2180;

/** At low zooms one map tile spans many source tiles — step to coarser levels beyond this. */
const MAX_SOURCE_TILES = 12;

/**
 * Shows an EPSG:2180 WMTS on the Web Mercator map: every map tile is a canvas onto which
 * the overlapping 2180 tiles are drawn with an affine transform (rotation + scale), which
 * across one tile matches the true reprojection to well under a pixel.
 */
export class Wmts2180GridLayer extends L.GridLayer {
  private readonly config: Config;

  constructor(config: Config, options?: L.GridLayerOptions) {
    super(options);
    this.config = config;
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const cfg = this.config;
    const size = this.getTileSize();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;

    const map = (this as unknown as { _map: L.Map })._map;
    const [p0, p1, p2, p3] = tileCorners2180(map, coords, size);
    const bbox = {
      minE: Math.min(p0.x, p1.x, p2.x, p3.x),
      maxE: Math.max(p0.x, p1.x, p2.x, p3.x),
      minN: Math.min(p0.y, p1.y, p2.y, p3.y),
      maxN: Math.max(p0.y, p1.y, p2.y, p3.y),
    };

    let level = chooseLevel(Math.hypot(p1.x - p0.x, p1.y - p0.y) / (size.x * dpr), cfg.resolutions);
    let range = null;
    for (; level >= 0; level--) {
      const span = cfg.tileSize * cfg.resolutions[level]!;
      range = sourceTileRange(
        bbox,
        cfg.originEasting,
        cfg.originNorthing,
        span,
        cfg.matrixSize[level]!,
      );
      if (
        !range ||
        (range.col1 - range.col0 + 1) * (range.row1 - range.row0 + 1) <= MAX_SOURCE_TILES
      )
        break;
    }
    if (!range || level < 0) {
      queueMicrotask(() => done(undefined, canvas));
      return canvas;
    }

    const res = cfg.resolutions[level]!;
    const span = cfg.tileSize * res;
    const m = metresToTilePixels(p0, p1, p2, size.x);
    const ctx = canvas.getContext('2d')!;
    const loads: Promise<void>[] = [];
    for (let row = range.row0; row <= range.row1; row++) {
      for (let col = range.col0; col <= range.col1; col++) {
        const e0 = cfg.originEasting + col * span;
        const n0 = cfg.originNorthing - row * span;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        loads.push(
          new Promise<void>((resolve) => {
            img.onload = () => {
              // source pixel (u, v) → metres (e0 + u·res, n0 − v·res) → tile pixel via m, × dpr
              const t = projectedImageTransform(m, e0, n0, res, dpr);
              ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
              // half-pixel overlap hides hairline seams between source tiles
              ctx.drawImage(img, -0.5, -0.5, cfg.tileSize + 1, cfg.tileSize + 1);
              resolve();
            };
            img.onerror = () => resolve();
          }),
        );
        img.src =
          `${cfg.url}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${cfg.layer}&STYLE=default` +
          `&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:${level}&TILEROW=${row}&TILECOL=${col}` +
          `&FORMAT=${encodeURIComponent(cfg.format)}`;
      }
    }
    void Promise.all(loads).then(() => done(undefined, canvas));
    return canvas;
  }
}
