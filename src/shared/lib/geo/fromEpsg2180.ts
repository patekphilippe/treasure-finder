import { getProj4 } from './crs';

/** EPSG:2180 x (easting), y (northing) in metres → WGS84 [lat, lng]. */
export function fromEpsg2180(x: number, y: number): [number, number] {
  const [lng, lat] = getProj4()('EPSG:2180', 'EPSG:4326', [x, y]) as [number, number];
  return [lat, lng];
}
