import { describe, expect, it } from 'vitest';
import { coversView, viewRequest2180 } from '@/features/map/utils/viewRequest2180';

const OPTS = { margin: 0.2, maxSide: 2048, minRes: 1 };
// a 2 × 1.5 km view on a 1000 × 750 px screen: 2 m per pixel
const view = (e0: number, n0: number) => [
  { x: e0, y: n0 },
  { x: e0 + 2000, y: n0 },
  { x: e0, y: n0 - 1500 },
  { x: e0 + 2000, y: n0 - 1500 },
];

describe('one WMS image per view', () => {
  it('asks for the view plus a 20% margin at screen sharpness', () => {
    const r = viewRequest2180(view(270_000, 330_000), 1000, 750, OPTS);
    expect(r.res).toBe(2);
    expect(r.originE).toBe(270_000 - 400);
    expect(r.originN).toBe(330_000 + 300);
    expect([r.w, r.h]).toEqual([1400, 1050]);
  });

  it('never asks sharper than the scan nor larger than the server allows', () => {
    // 1 × 0.75 km on a very sharp screen: 0.125 m per pixel asked, the scan has 1 m
    const sharp = viewRequest2180(
      [
        { x: 0, y: 0 },
        { x: 1000, y: -750 },
      ],
      8000,
      6000,
      OPTS,
    );
    expect(sharp.res).toBe(1);
    const wide = viewRequest2180(
      [
        { x: 0, y: 0 },
        { x: 50_000, y: -40_000 },
      ],
      1000,
      800,
      OPTS,
    );
    expect(Math.max(wide.w, wide.h)).toBeLessThanOrEqual(2048);
  });

  it('keeps the current image for a short pan, asks again after zooming in or panning away', () => {
    const shown = viewRequest2180(view(270_000, 330_000), 1000, 750, OPTS);
    expect(coversView(shown, viewRequest2180(view(270_300, 330_200), 1000, 750, OPTS), 0.2)).toBe(
      true,
    );
    expect(coversView(shown, viewRequest2180(view(272_000, 330_000), 1000, 750, OPTS), 0.2)).toBe(
      false,
    );
    // zoomed in 2×: the image would be blurry
    const zoomed = viewRequest2180(
      [
        { x: 270_500, y: 329_600 },
        { x: 271_500, y: 329_600 },
        { x: 270_500, y: 328_850 },
        { x: 271_500, y: 328_850 },
      ],
      1000,
      750,
      OPTS,
    );
    expect(coversView(shown, zoomed, 0.2)).toBe(false);
    expect(coversView(null, zoomed, 0.2)).toBe(false);
  });
});
