import { OWN_MAP_MAX_PIXELS } from '../config/ownMaps';

/**
 * An image source as WebP (PNG where WebP encoding is missing), downscaled so it stays under the
 * phone canvas limit. Returns the size kept; the caller rescales the georeference by it.
 */
export async function encodeImage(
  draw: (ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) => void,
  width: number,
  height: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, Math.sqrt(OWN_MAP_MAX_PIXELS / (width * height)));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  draw(ctx, w, h);
  return {
    blob: await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 }),
    width: w,
    height: h,
  };
}
