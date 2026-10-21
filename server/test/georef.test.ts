import { describe, expect, it } from 'vitest';
import { fitAffine, localPlane, placeByNames, placeBySheet } from '../src/pipeline/georef';
import { dhdnToWgs84 } from '@/shared/lib/geo/dhdnToWgs84';

describe('georeferencing', () => {
  it('fits an exact affine map with zero error', () => {
    const src = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const dst = src.map((p) => ({ x: 1000 + 2000 * p.x + 50 * p.y, y: 500 - 1500 * p.y }));
    const fit = fitAffine(src, dst)!;
    expect(fit.rms).toBeLessThan(1e-6);
    expect(fit.apply({ x: 0.5, y: 0.5 }).x).toBeCloseTo(2025, 6);
  });

  it('places a map from three named villages and drops a same-named village far away', () => {
    // a 4 km wide map in square units (the pipeline scales y by height ÷ width first)
    const plane = localPlane({ lat: 50.77, lng: 15.78 });
    const at = (u: number, v: number) => plane.toLatLng(u * 4000, -v * 4000);
    const pairs = [
      { uv: { x: 0.1, y: 0.2 }, at: at(0.1, 0.2) },
      { uv: { x: 0.8, y: 0.3 }, at: at(0.8, 0.3) },
      { uv: { x: 0.4, y: 0.9 }, at: at(0.4, 0.9) },
      { uv: { x: 0.6, y: 0.6 }, at: at(0.6, 0.6) },
      // "Arnsdorf" matched the wrong village 12 km away
      { uv: { x: 0.2, y: 0.7 }, at: plane.toLatLng(12_000, 8000) },
    ];
    const p = placeByNames(pairs)!;
    expect(p.method).toBe('nazwy');
    expect(p.rmsM).toBeLessThan(5);
    const mid = p.toLatLng({ x: 0.5, y: 0.5 });
    const want = at(0.5, 0.5);
    expect(Math.abs(mid.lat - want.lat) * 110_574).toBeLessThan(5);
  });

  it('refuses to place a map from fewer than three names', () => {
    expect(placeByNames([{ uv: { x: 0, y: 0 }, at: { lat: 50, lng: 16 } }])).toBeNull();
  });

  it('places a Messtischblatt photo from sheet 4968 and its frame corners (old German datum to WGS84)', () => {
    const frame = {
      nw: { x: 0.05, y: 0.04 },
      ne: { x: 0.95, y: 0.06 },
      se: { x: 0.94, y: 0.96 },
      sw: { x: 0.06, y: 0.95 },
    };
    const p = placeBySheet('messtischblatt', '4968', frame)!;
    const nw = p.toLatLng(frame.nw);
    const want = dhdnToWgs84(51.1, 17);
    expect(nw.lat).toBeCloseTo(want.lat, 6);
    expect(nw.lng).toBeCloseTo(want.lng, 6);
    expect(p.toLatLng(frame.se).lat).toBeCloseTo(dhdnToWgs84(51, 17 + 10 / 60).lat, 6);
    // the frame is ~130 m south of its printed latitude
    expect((51.1 - nw.lat) * 111_200).toBeGreaterThan(100);
  });
});

describe('gazetteer answers', () => {
  it('treats a village returned twice (point and boundary) as one place, not as ambiguous', async () => {
    const { uniquePlace } = await import('../src/pipeline/gazetteer');
    const karpacz = [
      { lat: 50.7752, lng: 15.7569, name: 'Karpacz' },
      { lat: 50.7731, lng: 15.7414, name: 'Karpacz' },
    ];
    expect(uniquePlace(karpacz)?.name).toBe('Karpacz');
    const arnsberg = [
      { lat: 50.79, lng: 15.82, name: 'Krowiniec' },
      { lat: 50.86, lng: 15.95, name: 'Podgórze' },
    ];
    expect(uniquePlace(arnsberg)).toBeNull();
    expect(uniquePlace([])).toBeNull();
  });
});

describe('placing a map from few names', () => {
  it('places a north-up map exactly from two named places far apart', () => {
    const plane = localPlane({ lat: 50.77, lng: 15.78 });
    // 1 image unit = 3000 m, north up
    const at = (u: number, v: number) => plane.toLatLng(u * 3000, -v * 3000);
    const p = placeByNames([
      { uv: { x: 0.2, y: 0.3 }, at: at(0.2, 0.3) },
      { uv: { x: 0.8, y: 0.7 }, at: at(0.8, 0.7) },
    ])!;
    expect(p.uncertaintyM).toBe(300);
    const mid = p.toLatLng({ x: 0.5, y: 0.1 });
    const want = at(0.5, 0.1);
    expect(Math.abs(mid.lat - want.lat) * 110_574).toBeLessThan(1);
    expect(Math.abs(mid.lng - want.lng) * 70_000).toBeLessThan(1);
  });

  it('refuses two names closer than 500 m (likely one place read twice)', () => {
    expect(
      placeByNames([
        { uv: { x: 0.1, y: 0.1 }, at: { lat: 50.77, lng: 15.78 } },
        { uv: { x: 0.9, y: 0.9 }, at: { lat: 50.771, lng: 15.781 } },
      ]),
    ).toBeNull();
  });
});

describe('names read on maps', () => {
  it('writes out "B." as -berg and skips cut-off labels', async () => {
    const { nameVariants } = await import('../src/pipeline/gazetteer');
    expect(nameVariants('Zimmer B')).toEqual(['Zimmer B', 'Zimmerberg']);
    expect(nameVariants('Raben Bg.')).toEqual(['Raben Bg.', 'Rabenberg']);
    expect(nameVariants('Ober-')).toEqual([]);
    expect(nameVariants('Krummhübel')).toEqual(['Krummhübel']);
  });

  it('prefers the village point over the commune boundary', async () => {
    const { uniquePlace } = await import('../src/pipeline/gazetteer');
    const p = uniquePlace([
      { lat: 50.79, lng: 15.73, name: 'Karpacz', boundary: true },
      { lat: 50.7752, lng: 15.7569, name: 'Karpacz' },
    ]);
    expect(p).toMatchObject({ lat: 50.7752, lng: 15.7569 });
  });
});

describe('few names with one wrong match', () => {
  const plane = localPlane({ lat: 50.77, lng: 15.79 });
  // a 3 km wide crop, north up
  const at = (u: number, v: number, name: string) => ({
    ...plane.toLatLng(u * 3000, -v * 3000),
    name,
  });

  it('fits shift, rotation and scale through three good names with a real error check', () => {
    const p = placeByNames([
      { uv: { x: 0.2, y: 0.2 }, at: at(0.2, 0.2, 'Karpacz') },
      { uv: { x: 0.8, y: 0.3 }, at: at(0.8, 0.3, 'Izbica') },
      { uv: { x: 0.5, y: 0.9 }, at: at(0.5, 0.9, 'Budniki') },
    ])!;
    expect(p.rmsM).toBe(0);
    expect(p.uncertaintyM).toBe(150);
    expect(p.anchors).toEqual(['Karpacz', 'Izbica', 'Budniki']);
  });

  it('refuses three names when one points 3 km off, instead of bending the map through it', () => {
    const p = placeByNames([
      { uv: { x: 0.2, y: 0.2 }, at: at(0.2, 0.2, 'Karpacz') },
      { uv: { x: 0.8, y: 0.3 }, at: at(0.8, 0.3, 'Izbica') },
      { uv: { x: 0.5, y: 0.9 }, at: at(1.5, 0.9, 'Rabenstein (wrong rock)') },
    ]);
    expect(p).toBeNull();
  });

  it('drops the wrong one when four names are read', () => {
    const p = placeByNames([
      { uv: { x: 0.2, y: 0.2 }, at: at(0.2, 0.2, 'Karpacz') },
      { uv: { x: 0.8, y: 0.3 }, at: at(0.8, 0.3, 'Izbica') },
      { uv: { x: 0.5, y: 0.9 }, at: at(0.5, 0.9, 'Budniki') },
      { uv: { x: 0.3, y: 0.7 }, at: at(1.4, 0.7, 'Rabenstein (wrong rock)') },
    ])!;
    expect(p.anchors).toEqual(['Karpacz', 'Izbica', 'Budniki']);
    const corner = p.toLatLng({ x: 1, y: 1 });
    const want = at(1, 1, '');
    expect(Math.abs(corner.lat - want.lat) * 110_574).toBeLessThan(1);
  });
});
