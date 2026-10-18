import type { ExclusionGroup } from '../../config/bdotWms';
import { applyExclusion, exclusionRequests } from './bdotExclusion';

/** A slow Geoportal (it can take a minute to fail) must not hold the analysis up. */
const REQUEST_TIMEOUT_MS = 30_000;

export interface ExclusionGroupResult {
  label: string;
  /** bit of this group in the mask */
  bit: number;
  /** ok: features found; empty: the answer had none; error: no usable answer (skipped) */
  status: 'ok' | 'empty' | 'error';
  /** share of the grid covered by this group (with its buffer), 0–1 */
  share: number;
}

/**
 * Bit mask of BDOT10k buildings, paved roads, railways and water (plus buffers) on an EPSG:2180
 * grid, one bit per group, with what happened to each group. fetch + OffscreenCanvas, so it runs
 * in workers too. A group that fails is skipped and reported as 'error'.
 */
export async function fetchExclusionMask(
  originE: number,
  originN: number,
  res: number,
  w: number,
  h: number,
  groups?: ExclusionGroup[],
): Promise<{ mask: Uint8Array; groups: ExclusionGroupResult[] }> {
  const g = { originE, originN, res, w, h };
  const mask = new Uint8Array(w * h);
  const results = await Promise.all(
    exclusionRequests(g, groups).map(async (req): Promise<ExclusionGroupResult> => {
      const result = { label: req.label, bit: req.bit, share: 0 };
      try {
        const response = await fetch(req.url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        // Geoportal answers images with 404
        if (!response.ok && response.status !== 404) return { ...result, status: 'error' };
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = new OffscreenCanvas(req.mw, req.mh);
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0, req.mw, req.mh);
        bitmap.close();
        const cells = applyExclusion(mask, ctx.getImageData(0, 0, req.mw, req.mh).data, req, g);
        return { ...result, status: cells ? 'ok' : 'empty', share: cells / (w * h) };
      } catch {
        // offline, blocked, too slow, or not an image (e.g. a WMS error document)
        return { ...result, status: 'error' };
      }
    }),
  );
  return { mask, groups: results };
}
