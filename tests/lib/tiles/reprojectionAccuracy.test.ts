import { describe, expect, it } from 'vitest';
import { toEpsg2180 } from '@/shared/lib/geo';
import { applyAffine, latLngToTile, metresToTilePixels, tileToLatLng } from '@/shared/lib/tiles';

/**
 * docs/PLAN.md, Etap 1: the sheet layers must sit on the orthophoto within 2 m, and a control
 * point in EPSG:2180 must land on the map within 1 m. The layers warp the EPSG:2180 image onto
 * each map tile with one affine map from the tile's corners; this measures its worst error.
 */
const TILE = 256;
const at = (x: number, y: number, z: number) => {
  const ll = tileToLatLng(x, y, z);
  const [e, n] = toEpsg2180(ll.lat, ll.lng);
  return { x: e, y: n };
};

// north-west corner of Poland, the largest meridian convergence from the 19°E axis
const PLACES = [
  { lat: 53.9, lng: 14.2 },
  { lat: 49.3, lng: 23.9 },
  { lat: 52.1, lng: 19.4 },
];

describe('EPSG:2180 image on Web Mercator tiles', () => {
  for (const z of [12, 15, 17, 19])
    it(`zoom ${z}: worst error under half a pixel (and under 1 m from zoom 15)`, () => {
      const metresPerPixel = (156543.03 * Math.cos((53.9 * Math.PI) / 180)) / 2 ** z;
      for (const p of PLACES) {
        const t = latLngToTile(p.lat, p.lng, z);
        const x = Math.floor(t.x);
        const y = Math.floor(t.y);
        const m = metresToTilePixels(at(x, y, z), at(x + 1, y, z), at(x, y + 1, z), TILE);
        let worstPx = 0;
        for (let i = 0; i <= 8; i++)
          for (let j = 0; j <= 8; j++) {
            const exact = { x: (i / 8) * TILE, y: (j / 8) * TILE };
            const got = applyAffine(m, at(x + i / 8, y + j / 8, z));
            worstPx = Math.max(worstPx, Math.hypot(got.x - exact.x, got.y - exact.y));
          }
        expect(worstPx).toBeLessThan(0.5);
        // at zoom 12 a pixel is ~22 m: metres only matter once 1–2 m are visible
        if (z >= 15) expect(worstPx * metresPerPixel).toBeLessThan(1);
      }
    });
});
