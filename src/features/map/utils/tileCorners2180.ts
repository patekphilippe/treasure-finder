import type L from 'leaflet';
import { getProj4 } from '@/shared/lib/geo/crs';
import type { XY } from '@/shared/lib/tiles';

/** EPSG:2180 metres of a map tile's corners: top-left, top-right, bottom-left, bottom-right. */
export function tileCorners2180(map: L.Map, coords: L.Coords, size: L.Point): [XY, XY, XY, XY] {
  const proj = getProj4();
  const nw = coords.scaleBy(size);
  const at = (px: number, py: number): XY => {
    const ll = map.unproject([nw.x + px, nw.y + py], coords.z);
    const [x, y] = proj('EPSG:4326', 'EPSG:2180', [ll.lng, ll.lat]) as [number, number];
    return { x, y };
  };
  return [at(0, 0), at(size.x, 0), at(0, size.y), at(size.x, size.y)];
}
