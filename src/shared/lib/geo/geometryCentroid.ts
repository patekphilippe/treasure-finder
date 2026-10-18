import type { MultiPolygon, Polygon } from 'geojson';

/** Area-weighted centroid of a (Multi)Polygon in degrees; fine for field-sized zones. */
export function geometryCentroid(g: Polygon | MultiPolygon): { lat: number; lng: number } {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  // relative to the first vertex: the shoelace formula loses precision on large coordinates
  const [ox, oy] = polys[0]![0]![0] as [number, number];
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of polys)
    for (const ring of poly)
      for (let i = 0; i < ring.length - 1; i++) {
        const x0 = ring[i]![0]! - ox;
        const y0 = ring[i]![1]! - oy;
        const x1 = ring[i + 1]![0]! - ox;
        const y1 = ring[i + 1]![1]! - oy;
        const cr = x0 * y1 - x1 * y0;
        A += cr;
        cx += (x0 + x1) * cr;
        cy += (y0 + y1) * cr;
      }
  if (!A) return { lat: oy, lng: ox };
  return { lat: oy + cy / (3 * A), lng: ox + cx / (3 * A) };
}
