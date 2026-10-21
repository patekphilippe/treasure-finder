const RAD = Math.PI / 180;
const ARCSEC = RAD / 3600;

/** Bessel 1841, the ellipsoid of the old German survey (DHDN / Potsdam / Rauenberg) */
const BESSEL = { a: 6377397.155, f: 1 / 299.1528128 };
const WGS84 = { a: 6378137, f: 1 / 298.257223563 };
/** DHDN → WGS84, seven parameters (m, arc seconds, ppm), position-vector rotation as PROJ's towgs84 */
const T = { x: 598.1, y: 73.7, z: 418.2, rx: 0.202, ry: 0.045, rz: -2.455, s: 6.7 };

const e2 = (f: number) => 2 * f - f * f;

/**
 * Degrees in the old German datum (Messtischblatt and Karte des Deutschen Reiches frames, their
 * graticule) → WGS84. Around Poznań the difference is ~150 m south and ~155 m west: a sheet placed by
 * its printed corners without it sits that far north-east. No proj4: the worker uses it too.
 */
export function dhdnToWgs84(lat: number, lng: number): { lat: number; lng: number } {
  const p = lat * RAD;
  const l = lng * RAD;
  const eb = e2(BESSEL.f);
  const n = BESSEL.a / Math.sqrt(1 - eb * Math.sin(p) ** 2);
  const x = n * Math.cos(p) * Math.cos(l);
  const y = n * Math.cos(p) * Math.sin(l);
  const z = n * (1 - eb) * Math.sin(p);
  const k = 1 + T.s * 1e-6;
  const [rx, ry, rz] = [T.rx * ARCSEC, T.ry * ARCSEC, T.rz * ARCSEC];
  const X = T.x + k * (x - rz * y + ry * z);
  const Y = T.y + k * (rz * x + y - rx * z);
  const Z = T.z + k * (-ry * x + rx * y + z);
  // geocentric → geodetic on WGS84, a few iterations are exact to well under a millimetre
  const ew = e2(WGS84.f);
  const r = Math.hypot(X, Y);
  let phi = Math.atan2(Z, r * (1 - ew));
  for (let i = 0; i < 6; i++) {
    const nw = WGS84.a / Math.sqrt(1 - ew * Math.sin(phi) ** 2);
    phi = Math.atan2(Z + ew * nw * Math.sin(phi), r);
  }
  return { lat: phi / RAD, lng: Math.atan2(Y, X) / RAD };
}
