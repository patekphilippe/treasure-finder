import L from 'leaflet';
import {
  canvasDpr,
  metresToTilePixels,
  pickSourceTiles,
  projectedImageTransform,
  type Wmts2180Source,
} from '@/shared/lib/tiles';
import { tileCorners2180 } from '../utils/tileCorners2180';

/**
 * Shows an EPSG:2180 WMTS on the Web Mercator map: every map tile is a canvas onto which
 * the overlapping 2180 tiles are drawn with an affine transform (rotation + scale), which
 * across one tile matches the true reprojection to well under a pixel.
 */
export class Wmts2180GridLayer extends L.GridLayer {
  private readonly config: Wmts2180Source;

  constructor(config: Wmts2180Source, options?: L.GridLayerOptions) {
    super(options);
    this.config = config;
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const cfg = this.config;
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;

    const map = (this as unknown as { _map: L.Map })._map;
    const corners = tileCorners2180(map, coords, size);
    const picked = pickSourceTiles(corners, size.x, dpr, cfg);
    if (!picked) {
      queueMicrotask(() => done(undefined, canvas));
      return canvas;
    }
    const { level, range } = picked;
    const [p0, p1, p2] = corners;

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
        img.src = cfg.tileUrl(level, row, col);
      }
    }
    void Promise.all(loads).then(() => done(undefined, canvas));
    return canvas;
  }
}
