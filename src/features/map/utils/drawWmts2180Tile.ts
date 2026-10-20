import type L from 'leaflet';
import {
  metresToTilePixels,
  pickSourceTiles,
  projectedImageTransform,
  type Wmts2180Source,
} from '@/shared/lib/tiles';
import { tileCorners2180 } from './tileCorners2180';

/**
 * Draws the EPSG:2180 WMTS tiles overlapping one map tile onto its canvas with an affine
 * transform (rotation + scale), which across one tile matches the true reprojection to well
 * under a pixel. Resolves once every source tile is drawn or failed. `isCurrent` false skips
 * drawing (the canvas got something better meanwhile).
 */
export function drawWmts2180Tile(
  ctx: CanvasRenderingContext2D,
  map: L.Map,
  coords: L.Coords,
  size: L.Point,
  dpr: number,
  cfg: Wmts2180Source,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const corners = tileCorners2180(map, coords, size);
  const picked = pickSourceTiles(corners, size.x, dpr, cfg);
  if (!picked) return Promise.resolve();
  const { level, range } = picked;
  const [p0, p1, p2] = corners;

  const res = cfg.resolutions[level]!;
  const span = cfg.tileSize * res;
  const m = metresToTilePixels(p0, p1, p2, size.x);
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
            if (isCurrent()) {
              // source pixel (u, v) → metres (e0 + u·res, n0 − v·res) → tile pixel via m, × dpr
              const t = projectedImageTransform(m, e0, n0, res, dpr);
              ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
              // half-pixel overlap hides hairline seams between source tiles
              ctx.drawImage(img, -0.5, -0.5, cfg.tileSize + 1, cfg.tileSize + 1);
            }
            resolve();
          };
          img.onerror = () => resolve();
        }),
      );
      img.src = cfg.tileUrl(level, row, col);
    }
  }
  return Promise.all(loads).then(() => undefined);
}
