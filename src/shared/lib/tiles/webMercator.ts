/** Web Mercator (EPSG:3857) tile maths for 256 px tiles, as Leaflet and the WMTS use it. */
export function tileToLatLng(x: number, y: number, z: number): { lat: number; lng: number } {
  const n = 2 ** z;
  return {
    lng: (x / n) * 360 - 180,
    lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI,
  };
}

/** Fractional tile coordinates of a point. */
export function latLngToTile(lat: number, lng: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n,
  };
}
