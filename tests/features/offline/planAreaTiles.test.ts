import { describe, expect, it } from 'vitest';
import { MAX_AREA_TILES } from '@/features/offline/config/offlineAreas';
import { planAreaTiles } from '@/features/offline/utils/planAreaTiles';

// about 1 km × 1 km near Legnica
const small = { south: 51.29, west: 16.12, north: 51.299, east: 16.134 };
const none = { ortho: false, nmt: false, custom: [] };

describe('planAreaTiles', () => {
  it('lists orthophoto tiles for zooms 12–19 without duplicates', () => {
    const plan = planAreaTiles(small, { ...none, ortho: true }, 2);
    expect(plan.tooLarge).toBe(false);
    expect(plan.urls).toHaveLength(plan.counts.ortho);
    expect(new Set(plan.urls).size).toBe(plan.urls.length);
    expect(plan.urls.some((u) => u.includes('TILEMATRIX=EPSG:3857:12&'))).toBe(true);
    expect(plan.urls.some((u) => u.includes('TILEMATRIX=EPSG:3857:19&'))).toBe(true);
    expect(plan.urls.some((u) => u.includes('TILEMATRIX=EPSG:3857:20&'))).toBe(false);
  });

  it('lists the EPSG:2180 hillshade tiles the NMT layer draws from', () => {
    const plan = planAreaTiles(small, { ...none, nmt: true }, 2);
    expect(plan.counts.nmt).toBeGreaterThan(0);
    expect(plan.counts.nmt).toBeLessThan(plan.counts.ortho + 400);
    expect(plan.urls.every((u) => u.includes('TILEMATRIXSET=EPSG:2180'))).toBe(true);
    // the finest level shows up at the highest zooms
    expect(plan.urls.some((u) => u.includes('TILEMATRIX=EPSG:2180:12&'))).toBe(true);
  });

  it('never lists the topographic map (its service forbids harvesting)', () => {
    const plan = planAreaTiles(small, { ...none, ortho: true, nmt: true }, 2);
    expect(plan.urls.some((u) => u.includes('wmts/TOPO'))).toBe(false);
  });

  it('custom XYZ tiles stop at their native zoom', () => {
    const plan = planAreaTiles(
      small,
      { ...none, custom: [{ url: 'https://t.example/{z}/{x}/{y}.png', maxNativeZoom: 16 }] },
      1,
    );
    expect(plan.urls.some((u) => u.startsWith('https://t.example/16/'))).toBe(true);
    expect(plan.urls.some((u) => u.startsWith('https://t.example/17/'))).toBe(false);
  });

  it('a large area is only counted and marked too large', () => {
    const big = { south: 51.0, west: 16.0, north: 51.3, east: 16.5 };
    const plan = planAreaTiles(big, { ...none, ortho: true, nmt: true }, 2);
    expect(plan.tooLarge).toBe(true);
    expect(plan.total).toBeGreaterThan(MAX_AREA_TILES);
    expect(plan.urls).toHaveLength(0);
  });

  it('estimates the size from the tile counts', () => {
    const plan = planAreaTiles(small, { ...none, ortho: true, nmt: true }, 2);
    expect(plan.bytes).toBeGreaterThan(0);
    expect(plan.total).toBe(plan.counts.ortho + plan.counts.nmt);
  });
});
