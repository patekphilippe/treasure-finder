import { boxMean } from './boxMean';

/** LRM = DEM − mean over a (2r+1)² window. */
export function localRelief(
  dem: Float32Array,
  w: number,
  h: number,
  radiusCells: number,
): Float32Array {
  const mean = boxMean(dem, w, h, radiusCells);
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = dem[i]! - mean[i]!;
  return out;
}

/** 1 where the LRM window is complete: away from the sheet edge and from NODATA. */
export function validZone(
  dem: Float32Array,
  w: number,
  h: number,
  radiusCells: number,
): Uint8Array {
  const nod = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) nod[i] = Number.isNaN(dem[i]!) ? 1 : 0;
  const near = boxMean(nod, w, h, radiusCells);
  const ok = new Uint8Array(w * h);
  const r = radiusCells;
  for (let y = r; y < h - r; y++)
    for (let x = r; x < w - r; x++) ok[y * w + x] = near[y * w + x]! > 0 ? 0 : 1;
  return ok;
}
