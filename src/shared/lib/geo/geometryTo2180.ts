import type { Geometry, Position } from 'geojson';
import { toEpsg2180 } from './toEpsg2180';

/** A WGS84 geometry in EPSG:2180 metres (same structure, coordinates [easting, northing]). */
export function geometryTo2180(g: Geometry): Geometry {
  const p = (c: Position): Position => toEpsg2180(c[1]!, c[0]!);
  switch (g.type) {
    case 'Point':
      return { type: 'Point', coordinates: p(g.coordinates) };
    case 'MultiPoint':
      return { type: 'MultiPoint', coordinates: g.coordinates.map(p) };
    case 'LineString':
      return { type: 'LineString', coordinates: g.coordinates.map(p) };
    case 'MultiLineString':
      return { type: 'MultiLineString', coordinates: g.coordinates.map((l) => l.map(p)) };
    case 'Polygon':
      return { type: 'Polygon', coordinates: g.coordinates.map((r) => r.map(p)) };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: g.coordinates.map((poly) => poly.map((r) => r.map(p))),
      };
    case 'GeometryCollection':
      return { type: 'GeometryCollection', geometries: g.geometries.map(geometryTo2180) };
  }
}
