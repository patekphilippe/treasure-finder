import type { Geometry } from 'geojson';
import polygonClipping, { type MultiPolygon as PcMulti } from 'polygon-clipping';
import type { XY } from './features/lines';

/**
 * Forbidden areas in local metres: exclusion zones of protected forms on this sheet plus
 * forbidden zones from outside (user's 'zakaz' zones, neighbouring sheets), as one union.
 */
export function forbiddenAreas(exclusions: PcMulti[], forbidden: Geometry[]): PcMulti {
  const parts: PcMulti[] = [...exclusions];
  for (const g of forbidden) {
    if (g.type === 'Polygon') parts.push([g.coordinates as PcMulti[number]]);
    else if (g.type === 'MultiPolygon') parts.push(g.coordinates as PcMulti);
  }
  let acc: PcMulti = [];
  for (const p of parts) {
    if (p.length === 0) continue;
    try {
      acc = acc.length ? polygonClipping.union(acc, p) : p;
    } catch {
      // a degenerate piece cannot be merged; keep it separately so it still protects
      acc = [...acc, ...p];
    }
  }
  return acc;
}

/** True when any of the points lies inside the areas (even–odd over rings, so holes count). */
export function touchesAreas(points: readonly XY[], areas: PcMulti): boolean {
  const polys = areas.map((rings) => {
    const xs = rings[0]!.map((v) => v[0]);
    const ys = rings[0]!.map((v) => v[1]);
    return {
      rings,
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as const,
    };
  });
  const inside = (p: XY, rings: PcMulti[number]) => {
    let c = false;
    for (const ring of rings)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i]!;
        const [xj, yj] = ring[j]!;
        if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
      }
    return c;
  };
  return points.some((p) =>
    polys.some(
      ({ rings, box }) =>
        p[0] >= box[0] && p[1] >= box[1] && p[0] <= box[2] && p[1] <= box[3] && inside(p, rings),
    ),
  );
}

/** Search zone minus forbidden areas (the zone unchanged when clipping fails). */
export function withoutAreas(zone: PcMulti, areas: PcMulti): PcMulti {
  if (zone.length === 0 || areas.length === 0) return zone;
  try {
    return polygonClipping.difference(zone, areas);
  } catch {
    return zone;
  }
}
