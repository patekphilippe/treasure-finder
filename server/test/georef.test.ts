import { describe, expect, it } from 'vitest';
import { fitAffine, localPlane, placeByNames, placeBySheet } from '../src/pipeline/georef';

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
    // a 4 × 3 km map: true positions of labels → lat/lng through a local plane
    const plane = localPlane({ lat: 50.77, lng: 15.78 });
    const at = (u: number, v: number) => plane.toLatLng(u * 4000, -v * 3000);
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

  it('places a Messtischblatt photo from sheet 4968 and its frame corners', () => {
    const frame = {
      nw: { x: 0.05, y: 0.04 },
      ne: { x: 0.95, y: 0.06 },
      se: { x: 0.94, y: 0.96 },
      sw: { x: 0.06, y: 0.95 },
    };
    const p = placeBySheet('messtischblatt', '4968', frame)!;
    const nw = p.toLatLng(frame.nw);
    expect(nw.lat).toBeCloseTo(51.1, 6);
    expect(nw.lng).toBeCloseTo(17.0, 6);
    expect(p.toLatLng(frame.se).lat).toBeCloseTo(51.0, 6);
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
