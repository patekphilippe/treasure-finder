import type { ImageGrid } from './types';

/**
 * Whether a building of today's BDOT10k mask (non-zero cells, same grid as the image) lies within
 * `bufferM` of the image pixel. The buffer absorbs the reading's position error.
 */
export function existsToday(
  mask: Uint8Array,
  g: ImageGrid,
  x: number,
  y: number,
  bufferM: number,
): boolean {
  const r = Math.ceil(bufferM / g.res);
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || py < 0 || px >= g.w || py >= g.h) continue;
      if (mask[py * g.w + px]) return true;
    }
  return false;
}
