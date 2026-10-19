import type { XY } from '@/shared/lib/tiles';

export interface ViewRequest {
  /** top-left corner of the image, EPSG:2180 */
  originE: number;
  originN: number;
  /** metres per image pixel */
  res: number;
  w: number;
  h: number;
}

export interface ViewRequestOptions {
  /** extra area on every side, as a share of the view, so a short pan needs no new image */
  margin: number;
  /** server limit and phone memory: longest side of the image */
  maxSide: number;
  /** below this the scan has no more detail (1:25 000 sheets: about 1 m) */
  minRes: number;
}

/**
 * One GetMap for the whole view: its EPSG:2180 box with a margin, at screen sharpness
 * (`pxW` × `pxH` device pixels), never sharper than the scan and never larger than `maxSide`.
 */
export function viewRequest2180(
  corners: readonly XY[],
  pxW: number,
  pxH: number,
  opts: ViewRequestOptions,
): ViewRequest {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minE = Math.min(...xs);
  const maxE = Math.max(...xs);
  const minN = Math.min(...ys);
  const maxN = Math.max(...ys);
  const padE = (maxE - minE) * opts.margin;
  const padN = (maxN - minN) * opts.margin;
  const spanE = maxE - minE + 2 * padE;
  const spanN = maxN - minN + 2 * padN;
  const screenRes = Math.max((maxE - minE) / pxW, (maxN - minN) / pxH);
  const res = Math.max(screenRes, opts.minRes, spanE / opts.maxSide, spanN / opts.maxSide);
  return {
    originE: minE - padE,
    originN: maxN + padN,
    res,
    w: Math.max(1, Math.round(spanE / res)),
    h: Math.max(1, Math.round(spanN / res)),
  };
}

/** Whether `have` still serves the view `want`: covers it and is sharp enough (within 1.5×). */
export function coversView(have: ViewRequest | null, want: ViewRequest, margin: number): boolean {
  if (!have) return false;
  const innerE0 = want.originE + (want.w * want.res * margin) / (1 + 2 * margin);
  const innerN0 = want.originN - (want.h * want.res * margin) / (1 + 2 * margin);
  const innerE1 = want.originE + want.w * want.res - (innerE0 - want.originE);
  const innerN1 = want.originN - want.h * want.res + (want.originN - innerN0);
  return (
    have.originE <= innerE0 &&
    have.originN >= innerN0 &&
    have.originE + have.w * have.res >= innerE1 &&
    have.originN - have.h * have.res <= innerN1 &&
    have.res <= want.res * 1.5
  );
}
