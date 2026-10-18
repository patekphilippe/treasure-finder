import { fillNodata, localRelief, validZone, type DemGrid } from '../raster';
import { components, type Component } from './components';
import { interpretConfig } from './interpretConfig';
import { open } from './morphology';

/** Everything the feature functions need about one sheet. */
export interface Scene {
  w: number;
  h: number;
  cell: number;
  originE: number;
  originN: number;
  /** NODATA filled */
  dem: Float32Array;
  lrm: Float32Array;
  /** 1 where the LRM window is complete and the cell is not excluded */
  ok: Uint8Array;
  convex: Uint8Array;
  concave: Uint8Array;
}

export function buildScene(grid: DemGrid, exclude?: Uint8Array, cfg = interpretConfig): Scene {
  const { w, h, cell } = grid;
  const dem = fillNodata(grid.dem, w, h);
  const r = Math.max(1, Math.round(cfg.lrm.radiusM / cell));
  const lrm = localRelief(dem, w, h, r);
  const ok = validZone(grid.dem, w, h, r);
  if (exclude) for (let i = 0; i < w * h; i++) if (exclude[i]) ok[i] = 0;
  const t = cfg.masks.thresholdM;
  let convex: Uint8Array = new Uint8Array(w * h);
  let concave: Uint8Array = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!ok[i]) continue;
    if (lrm[i]! > t) convex[i] = 1;
    else if (lrm[i]! < -t) concave[i] = 1;
  }
  convex = open(convex, w, h, cfg.masks.openingCells);
  concave = open(concave, w, h, cfg.masks.openingCells);
  return {
    w,
    h,
    cell,
    originE: grid.originE,
    originN: grid.originN,
    dem,
    lrm,
    ok,
    convex,
    concave,
  };
}

/** Components of a mask within the configured size range. */
export function sceneComponents(s: Scene, mask: Uint8Array, cfg = interpretConfig): Component[] {
  const cellArea = s.cell * s.cell;
  return components(mask, s.w, s.h, Math.ceil(cfg.masks.minAreaM2 / cellArea)).filter(
    (c) => c.cells.length * cellArea <= cfg.masks.maxAreaM2,
  );
}

/** Map direction (radians from east, counter-clockwise) between two cells. */
export function cellAngle(fromRow: number, fromCol: number, toRow: number, toCol: number): number {
  return Math.atan2(-(toRow - fromRow), toCol - fromCol);
}
