import type { ExclusionGroup } from '../../config/bdotWms';
import { applyExclusion, exclusionRequests } from './bdotExclusion';

/**
 * 1 where BDOT10k buildings, paved roads, railways or water (plus buffers) lie on an EPSG:2180
 * grid. fetch + OffscreenCanvas, so it runs in workers too. Network errors: that group is
 * skipped and the analysis runs without it.
 */
export async function fetchBuildingMask(
  originE: number,
  originN: number,
  res: number,
  w: number,
  h: number,
  groups?: ExclusionGroup[],
): Promise<Uint8Array> {
  const g = { originE, originN, res, w, h };
  const mask = new Uint8Array(w * h);
  await Promise.all(
    exclusionRequests(g, groups).map(async (req) => {
      try {
        const response = await fetch(req.url);
        if (!response.ok && response.status !== 404) return; // Geoportal answers images with 404
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = new OffscreenCanvas(req.mw, req.mh);
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0, req.mw, req.mh);
        bitmap.close();
        applyExclusion(mask, ctx.getImageData(0, 0, req.mw, req.mh).data, req, g);
      } catch {
        // offline or blocked: no exclusion for this group
      }
    }),
  );
  return mask;
}
