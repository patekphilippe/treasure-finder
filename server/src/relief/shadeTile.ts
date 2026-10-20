import { HILLSHADE_HI, HILLSHADE_LO, hillshadeMulti } from '@/shared/lib/raster/hillshadeMulti';
import { RELIEF_TILE_PX } from './config';
import { LATTICE_STEPS, type DemWindow } from './demWindow';

export interface ShadedTile {
  gray: Uint8Array;
  /** null when every pixel has data (then the tile can be a JPEG) */
  alpha: Uint8Array | null;
  /** no pixel has data: outside Poland or the sea */
  empty: boolean;
}

/**
 * The 16-direction hillshade of the window (as in the analysis, same grey stretch) resampled
 * onto the map tile: every tile pixel goes through the EPSG:2180 lattice to the DEM grid and
 * is interpolated bilinearly. Pixels next to missing heights stay transparent.
 */
export function shadeTile(win: DemWindow, dem: Float32Array, exaggeration = 1): ShadedTile {
  const { w, h, cell, e0, n1, lattice } = win;
  // a cell counts only with all eight neighbours known: the gradient needs them
  const ok = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let all = 1;
      for (let dy = -1; dy <= 1 && all; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          if (Number.isNaN(dem[yy * w + xx]!)) {
            all = 0;
            break;
          }
        }
      ok[y * w + x] = all;
    }
  // heights × k is the same as cells ÷ k
  const hs = hillshadeMulti(dem, w, h, cell / exaggeration);

  const P = RELIEF_TILE_PX;
  const L = LATTICE_STEPS + 1;
  const gray = new Uint8Array(P * P);
  const alpha = new Uint8Array(P * P);
  let opaque = 0;
  const span = 255 / (HILLSHADE_HI - HILLSHADE_LO);
  for (let v = 0; v < P; v++) {
    const gy = ((v + 0.5) / P) * LATTICE_STEPS;
    const j = Math.min(LATTICE_STEPS - 1, Math.floor(gy));
    const fy = gy - j;
    for (let u = 0; u < P; u++) {
      const gx = ((u + 0.5) / P) * LATTICE_STEPS;
      const i = Math.min(LATTICE_STEPS - 1, Math.floor(gx));
      const fx = gx - i;
      const a = (j * L + i) * 2;
      const b = a + 2;
      const c = a + L * 2;
      const d = c + 2;
      const wa = (1 - fx) * (1 - fy);
      const wb = fx * (1 - fy);
      const wc = (1 - fx) * fy;
      const wd = fx * fy;
      const e = lattice[a]! * wa + lattice[b]! * wb + lattice[c]! * wc + lattice[d]! * wd;
      const n =
        lattice[a + 1]! * wa + lattice[b + 1]! * wb + lattice[c + 1]! * wc + lattice[d + 1]! * wd;
      // DEM cell centres sit at e0 + (col + 0.5)·cell, n1 − (row + 0.5)·cell
      const col = (e - e0) / cell - 0.5;
      const row = (n1 - n) / cell - 0.5;
      const c0 = Math.floor(col);
      const r0 = Math.floor(row);
      if (c0 < 0 || r0 < 0 || c0 + 1 >= w || r0 + 1 >= h) continue;
      const k = r0 * w + c0;
      if (!ok[k] || !ok[k + 1] || !ok[k + w] || !ok[k + w + 1]) continue;
      const tx = col - c0;
      const ty = row - r0;
      const s =
        hs[k]! * (1 - tx) * (1 - ty) +
        hs[k + 1]! * tx * (1 - ty) +
        hs[k + w]! * (1 - tx) * ty +
        hs[k + w + 1]! * tx * ty;
      const p = v * P + u;
      gray[p] = Math.min(255, Math.max(0, Math.round((s - HILLSHADE_LO) * span)));
      alpha[p] = 255;
      opaque++;
    }
  }
  return { gray, alpha: opaque === P * P ? null : alpha, empty: opaque === 0 };
}
