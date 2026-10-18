import { BUILDING_BUFFER_M, BUILDINGS_WMS } from '../../config/bdotWms';
import { boxMean } from '../raster/boxMean';

/**
 * 1 where buildings, built-up land and their yards lie on an EPSG:2180 grid (top-left corner
 * originE/originN, `res` m per cell). Uses fetch + OffscreenCanvas, so it runs in workers too.
 * On any network error it returns an empty mask: the analysis then runs without exclusion.
 */
export async function fetchBuildingMask(
  originE: number,
  originN: number,
  res: number,
  w: number,
  h: number,
  bufferM = BUILDING_BUFFER_M,
): Promise<Uint8Array> {
  const mask = new Uint8Array(w * h);
  // the request may be coarser than the grid; the buffer hides the difference
  const step = Math.max(1, Math.ceil(Math.max(w, h) / 2000));
  const mw = Math.ceil(w / step);
  const mh = Math.ceil(h / step);
  const url =
    `${BUILDINGS_WMS.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${BUILDINGS_WMS.layers.join(',')}` +
    `&STYLES=&CRS=EPSG:2180&BBOX=${originN - h * res},${originE},${originN},${originE + w * res}` +
    `&WIDTH=${mw}&HEIGHT=${mh}&FORMAT=image/png&TRANSPARENT=TRUE`;
  try {
    const response = await fetch(url);
    if (!response.ok && response.status !== 404) return mask; // Geoportal answers images with 404
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(mw, mh);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, mw, mh);
    bitmap.close();
    const alpha = ctx.getImageData(0, 0, mw, mh).data;
    const built = new Float32Array(mw * mh);
    for (let i = 0; i < mw * mh; i++) built[i] = alpha[i * 4 + 3]! > 0 ? 1 : 0;
    const near = boxMean(built, mw, mh, Math.ceil(bufferM / (res * step)));
    for (let y = 0; y < h; y++) {
      const my = Math.min(mh - 1, Math.floor(y / step));
      for (let x = 0; x < w; x++)
        if (near[my * mw + Math.min(mw - 1, Math.floor(x / step))]! > 0) mask[y * w + x] = 1;
    }
  } catch {
    // offline or blocked: no exclusion
  }
  return mask;
}
