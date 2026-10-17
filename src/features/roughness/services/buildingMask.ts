import { boxMean } from '@/shared/lib/raster';
import { BUILDINGS_WMS, BUILDING_BUFFER_M } from '../config/roughness';

/**
 * True where buildings (BDOT10k: farm, residential, industrial, public, ruins) or
 * industrial / storage areas, squares and cemeteries lie, plus a buffer for the yard.
 * Removing buildings from the NMT leaves bumps, so these places are not marked.
 */
export async function buildingMask(
  originE: number,
  originN: number,
  res: number,
  w: number,
  h: number,
): Promise<Uint8Array> {
  // the mask may be coarser than the analysis grid; the buffer hides the difference
  const step = Math.max(1, Math.ceil(Math.max(w, h) / 2000));
  const mw = Math.ceil(w / step);
  const mh = Math.ceil(h / step);
  const n0 = originN - h * res;
  const e1 = originE + w * res;
  const url =
    `${BUILDINGS_WMS.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${BUILDINGS_WMS.layers.join(',')}` +
    `&STYLES=&CRS=EPSG:2180&BBOX=${n0},${originE},${originN},${e1}&WIDTH=${mw}&HEIGHT=${mh}` +
    '&FORMAT=image/png&TRANSPARENT=TRUE';

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = url;
  });
  const mask = new Uint8Array(w * h);
  if (!img) return mask; // service down: analyse without the exclusion

  const canvas = new OffscreenCanvas(mw, mh);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, mw, mh);
  const alpha = ctx.getImageData(0, 0, mw, mh).data;
  const built = new Float32Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) built[i] = alpha[i * 4 + 3]! > 0 ? 1 : 0;
  const near = boxMean(built, mw, mh, Math.ceil(BUILDING_BUFFER_M / (res * step)));
  for (let y = 0; y < h; y++) {
    const my = Math.min(mh - 1, Math.floor(y / step));
    for (let x = 0; x < w; x++) {
      if (near[my * mw + Math.min(mw - 1, Math.floor(x / step))]! > 0) mask[y * w + x] = 1;
    }
  }
  return mask;
}
