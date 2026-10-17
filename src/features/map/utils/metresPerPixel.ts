/** Ground metres per screen pixel in Web Mercator at a latitude and zoom. */
export function metresPerPixel(lat: number, zoom: number): number {
  return (40_075_016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);
}
