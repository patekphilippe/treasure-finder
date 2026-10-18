import { BDOT_EXCLUSION, BDOT_WMS_URL, type ExclusionGroup } from '../../config/bdotWms';
import { boxMean } from '../raster/boxMean';

export interface GridRef {
  originE: number;
  originN: number;
  /** metres per cell */
  res: number;
  w: number;
  h: number;
}

export interface ExclusionRequest {
  url: string;
  mw: number;
  mh: number;
  step: number;
  bufferM: number;
}

/** One WMS GetMap per group, at most ~2000 px a side (the buffer hides the coarser grid). */
export function exclusionRequests(
  g: GridRef,
  groups: ExclusionGroup[] = BDOT_EXCLUSION,
): ExclusionRequest[] {
  const step = Math.max(1, Math.ceil(Math.max(g.w, g.h) / 2000));
  const mw = Math.ceil(g.w / step);
  const mh = Math.ceil(g.h / step);
  return groups.map((grp) => ({
    url:
      `${BDOT_WMS_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${grp.layers.join(',')}` +
      `&STYLES=&CRS=EPSG:2180&BBOX=${g.originN - g.h * g.res},${g.originE},${g.originN},${g.originE + g.w * g.res}` +
      `&WIDTH=${mw}&HEIGHT=${mh}&FORMAT=image/png&TRANSPARENT=TRUE`,
    mw,
    mh,
    step,
    bufferM: grp.bufferM,
  }));
}

/** Marks cells within the request's buffer of any opaque pixel (RGBA data of the WMS image). */
export function applyExclusion(
  mask: Uint8Array,
  rgba: ArrayLike<number>,
  req: ExclusionRequest,
  g: GridRef,
): void {
  const { mw, mh, step } = req;
  const hit = new Float32Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) hit[i] = rgba[i * 4 + 3]! > 0 ? 1 : 0;
  const near = boxMean(hit, mw, mh, Math.max(1, Math.ceil(req.bufferM / (g.res * step))));
  for (let y = 0; y < g.h; y++) {
    const row = Math.min(mh - 1, Math.floor(y / step)) * mw;
    for (let x = 0; x < g.w; x++)
      if (near[row + Math.min(mw - 1, Math.floor(x / step))]! > 0) mask[y * g.w + x] = 1;
  }
}
