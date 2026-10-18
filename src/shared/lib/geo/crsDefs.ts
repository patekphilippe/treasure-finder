import { getProj4 } from './crs';

/**
 * Coordinate systems an own historical map may come in (GeoTIFF key or the user's choice for a
 * world file). DHDN (old German maps) uses the usual 7-parameter shift to WGS84.
 */
export const MAP_CRS: readonly { epsg: number; label: string; def?: string }[] = [
  { epsg: 2180, label: 'PUWG 1992 (EPSG:2180)' },
  { epsg: 3857, label: 'Web Mercator (EPSG:3857)' },
  { epsg: 4326, label: 'WGS84, stopnie (EPSG:4326)' },
  ...[15, 18, 21, 24].map((lon, i) => ({
    epsg: 2176 + i,
    label: `PL-2000 strefa ${5 + i} (EPSG:${2176 + i})`,
    def: `+proj=tmerc +lat_0=0 +lon_0=${lon} +k=0.999923 +x_0=${5 + i}500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`,
  })),
  ...[3, 4, 5].map((zone) => ({
    epsg: 31464 + zone,
    label: `DHDN Gauss-Krüger strefa ${zone} (EPSG:${31464 + zone})`,
    def: `+proj=tmerc +lat_0=0 +lon_0=${zone * 3} +k=1 +x_0=${zone}500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs`,
  })),
  {
    epsg: 4314,
    label: 'DHDN, stopnie (EPSG:4314)',
    def: '+proj=longlat +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +no_defs',
  },
  ...[33, 34].map((zone) => ({
    epsg: 32600 + zone,
    label: `UTM ${zone}N (EPSG:${32600 + zone})`,
    def: `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`,
  })),
];

export interface CrsTransform {
  to2180: (x: number, y: number) => [number, number];
  from2180: (e: number, n: number) => [number, number];
}

/** Conversions between a system from MAP_CRS and EPSG:2180, or null for an unknown system. */
export function crsTransform(epsg: number): CrsTransform | null {
  if (epsg === 2180) return { to2180: (x, y) => [x, y], from2180: (e, n) => [e, n] };
  const crs = MAP_CRS.find((c) => c.epsg === epsg);
  if (!crs) return null;
  const proj4 = getProj4();
  const name = `EPSG:${epsg}`;
  if (crs.def && !proj4.defs(name)) proj4.defs(name, crs.def);
  return {
    to2180: (x, y) => proj4(name, 'EPSG:2180', [x, y]) as [number, number],
    from2180: (e, n) => proj4('EPSG:2180', name, [e, n]) as [number, number],
  };
}
