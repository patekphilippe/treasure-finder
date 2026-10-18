import type { Geometry, Position } from 'geojson';

/** Where to put the marker of a context object: the point, the middle vertex of a line, the ring's mean. */
export function representativePoint(g: Geometry): { lat: number; lng: number } | null {
  const at = (p: Position | undefined) => (p ? { lat: p[1]!, lng: p[0]! } : null);
  const mean = (ring: Position[]) =>
    ring.length
      ? {
          lat: ring.reduce((s, p) => s + p[1]!, 0) / ring.length,
          lng: ring.reduce((s, p) => s + p[0]!, 0) / ring.length,
        }
      : null;

  switch (g.type) {
    case 'Point':
      return at(g.coordinates);
    case 'MultiPoint':
      return at(g.coordinates[0]);
    case 'LineString':
      return at(g.coordinates[Math.floor(g.coordinates.length / 2)]);
    case 'MultiLineString': {
      const line = g.coordinates[0] ?? [];
      return at(line[Math.floor(line.length / 2)]);
    }
    case 'Polygon':
      return mean(g.coordinates[0] ?? []);
    case 'MultiPolygon':
      return mean(g.coordinates[0]?.[0] ?? []);
    case 'GeometryCollection':
      return g.geometries.length ? representativePoint(g.geometries[0]!) : null;
  }
}
