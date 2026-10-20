// GRS80 and the PUWG 1992 transverse Mercator (EPSG:2180)
const A = 6378137;
const F = 1 / 298.257222101;
const K0 = 0.9993;
const LON0 = (19 * Math.PI) / 180;
const FALSE_E = 500_000;
const FALSE_N = -5_300_000;

const N = F / (2 - F);
const RECT = (A / (1 + N)) * (1 + (N * N) / 4 + N ** 4 / 64);
const ALPHA = [
  N / 2 - (2 * N * N) / 3 + (5 * N ** 3) / 16 + (41 * N ** 4) / 180,
  (13 * N * N) / 48 - (3 * N ** 3) / 5 + (557 * N ** 4) / 1440,
  (61 * N ** 3) / 240 - (103 * N ** 4) / 140,
  (49561 * N ** 4) / 161280,
];
const E2 = (2 * Math.sqrt(N)) / (1 + N);

/**
 * WGS84 → EPSG:2180 [easting, northing] in metres, Krüger series (Karney 2011) to 4th order:
 * well under a millimetre across Poland. The same as `toEpsg2180` without proj4, for the
 * backend, which renders thousands of points per tile and must stay small.
 */
export function toPuwg92(lat: number, lng: number): [number, number] {
  const phi = (lat * Math.PI) / 180;
  const dl = (lng * Math.PI) / 180 - LON0;
  const s = Math.sin(phi);
  const t = Math.sinh(Math.atanh(s) - E2 * Math.atanh(E2 * s));
  const xi0 = Math.atan2(t, Math.cos(dl));
  const eta0 = Math.atanh(Math.sin(dl) / Math.sqrt(1 + t * t));
  let xi = xi0;
  let eta = eta0;
  for (let j = 1; j <= 4; j++) {
    const a = ALPHA[j - 1]!;
    xi += a * Math.sin(2 * j * xi0) * Math.cosh(2 * j * eta0);
    eta += a * Math.cos(2 * j * xi0) * Math.sinh(2 * j * eta0);
  }
  return [FALSE_E + K0 * RECT * eta, FALSE_N + K0 * RECT * xi];
}
