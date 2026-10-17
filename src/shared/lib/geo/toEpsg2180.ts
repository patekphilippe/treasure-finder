import { proj4 } from './crs';

/** WGS84 lat/lng → EPSG:2180 [x (easting), y (northing)] in metres. */
export function toEpsg2180(lat: number, lng: number): [number, number] {
  return proj4('EPSG:4326', 'EPSG:2180', [lng, lat]) as [number, number];
}
