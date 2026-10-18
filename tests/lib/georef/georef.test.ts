import { describe, expect, it } from 'vitest';
import { crsTransform, toEpsg2180 } from '@/shared/lib/geo';
import { applyAffine, latLngToTile, tileToLatLng, type XY as XYp } from '@/shared/lib/tiles';
import {
  affineHomography,
  applyHomography,
  fitHomography,
  imageToTileAffine,
  invertHomography,
  parseWorldFile,
  sheetCorners,
} from '@/shared/lib/georef';

const close = (a: { x: number; y: number }, b: { x: number; y: number }, tol: number) => {
  expect(Math.abs(a.x - b.x)).toBeLessThan(tol);
  expect(Math.abs(a.y - b.y)).toBeLessThan(tol);
};

describe('homography', () => {
  it('takes four scan corners exactly to four map points, even with perspective', () => {
    const src = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 3000 },
      { x: 0, y: 3000 },
    ];
    const dst = [
      { x: 300_000, y: 380_000 },
      { x: 311_000, y: 380_400 },
      { x: 310_500, y: 371_000 },
      { x: 299_800, y: 371_300 },
    ];
    const h = fitHomography(src, dst);
    src.forEach((p, i) => close(applyHomography(h, p), dst[i]!, 1e-4));
    const back = invertHomography(h);
    dst.forEach((p, i) => close(applyHomography(back, p), src[i]!, 1e-6));
  });

  it('three points on a line cannot be fitted', () => {
    const line = [0, 1, 2, 3].map((i) => ({ x: i, y: i }));
    expect(() => fitHomography(line, line)).toThrow();
  });

  it('an affine map is a homography with an empty last row', () => {
    const h = affineHomography(2, 0, 0, -2, 10, 20);
    close(applyHomography(h, { x: 3, y: 4 }), { x: 16, y: 12 }, 1e-9);
  });
});

describe('world file', () => {
  it('maps the image corner half a pixel outside the first pixel centre', () => {
    const h = parseWorldFile('2.0\n0\n0\n-2.0\n300001.0\n380999.0\n');
    close(applyHomography(h, { x: 0, y: 0 }), { x: 300_000, y: 381_000 }, 1e-9);
    close(applyHomography(h, { x: 100, y: 50 }), { x: 300_200, y: 380_900 }, 1e-9);
  });

  it('accepts decimal commas and rejects broken files', () => {
    expect(() => parseWorldFile('1,5 0 0 -1,5 10 20')).not.toThrow();
    expect(() => parseWorldFile('1 0 0')).toThrow();
  });
});

describe('sheet corners from the sheet number', () => {
  it('Messtischblatt 4868 (Breslau Nord): 51°12′ N, 17°00′ E north-west corner, 10′ × 6′', () => {
    const b = sheetCorners('messtischblatt', '4868')!;
    expect(b.north).toBeCloseTo(51.2, 6);
    expect(b.west).toBeCloseTo(17, 6);
    expect((b.east - b.west) * 60).toBeCloseTo(10, 6);
    expect((b.north - b.south) * 60).toBeCloseTo(6, 6);
  });

  it('WIG 1:100 000 P47 S40 contains Beresteczko (50.36° N, 25.11° E)', () => {
    const b = sheetCorners('wig100', 'P47 S40')!;
    expect(50.36).toBeGreaterThan(b.south);
    expect(50.36).toBeLessThan(b.north);
    expect(25.11).toBeGreaterThan(b.west);
    expect(25.11).toBeLessThan(b.east);
  });

  it('WIG 1:25 000 letters split the 100k sheet 3 × 3 from the north-west', () => {
    const a = sheetCorners('wig25', 'P46-S34-A')!;
    const e = sheetCorners('wig25', 'P46-S34-E')!;
    const big = sheetCorners('wig100', 'P46 S34')!;
    expect(a.north).toBeCloseTo(big.north, 9);
    expect(a.west).toBeCloseTo(big.west, 9);
    expect(e.north).toBeCloseTo(big.north - 5 / 60, 9);
    expect(e.west).toBeCloseTo(big.west + 10 / 60, 9);
    expect(sheetCorners('wig25', 'P46 S34')).toBeNull();
    expect(sheetCorners('messtischblatt', 'abc')).toBeNull();
  });
});

describe('own map on map tiles', () => {
  const tileCorners = (x: number, y: number, z: number) =>
    [
      [x, y],
      [x + 1, y],
      [x, y + 1],
    ].map(([tx, ty]) => {
      const ll = tileToLatLng(tx!, ty!, z);
      const [e, n] = toEpsg2180(ll.lat, ll.lng);
      return { x: e, y: n };
    }) as [XYp, XYp, XYp];

  for (const [label, epsg, pixelToSource] of [
    ['WGS84 degrees', 4326, affineHomography(0.0005, 0, 0, -0.0005, 16, 51.4)],
    ['DHDN Gauss-Krüger 5', 31469, affineHomography(2, 0, 0, -2, 5_480_000, 5_700_000)],
    ['PUWG 1992', 2180, affineHomography(2, 0, 0, -2, 290_000, 395_000)],
  ] as const)
    it(`${label}: image pixels land on the tile within half a pixel`, () => {
      const crs = crsTransform(epsg)!;
      const toPixel = invertHomography(pixelToSource);
      const t = latLngToTile(51.3, 16.1, 16);
      const x = Math.floor(t.x);
      const y = Math.floor(t.y);
      const m = imageToTileAffine(tileCorners(x, y, 16), toPixel, crs, 256);
      let worst = 0;
      for (let i = 0; i <= 4; i++)
        for (let j = 0; j <= 4; j++) {
          const ll = tileToLatLng(x + i / 4, y + j / 4, 16);
          const [e, n] = toEpsg2180(ll.lat, ll.lng);
          const [sx, sy] = crs.from2180(e, n);
          const px = applyHomography(toPixel, { x: sx, y: sy });
          const got = applyAffine(m, px);
          worst = Math.max(worst, Math.hypot(got.x - (i / 4) * 256, got.y - (j / 4) * 256));
        }
      expect(worst).toBeLessThan(0.5);
    });

  it('an unknown system has no transform; PUWG 1992 is the identity', () => {
    expect(crsTransform(9999)).toBeNull();
    expect(crsTransform(2180)!.from2180(1, 2)).toEqual([1, 2]);
  });
});
