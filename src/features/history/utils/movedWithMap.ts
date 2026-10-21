import type { Geometry, Position } from 'geojson';
import type { ContextFeature } from '@/shared/types/domain';

type Coords = Position | Coords[];

/**
 * The objects seen only on one own map, moved with it (its placement was corrected after it was
 * read). Objects also seen on other maps stay: those maps say where they are too.
 */
export function movedWithMap(
  features: readonly ContextFeature[],
  mapId: string,
  move: (lng: number, lat: number) => [number, number],
): ContextFeature[] {
  const shift = (c: Coords): Coords =>
    typeof c[0] === 'number'
      ? move(c[0], (c as Position)[1]!)
      : (c as Coords[]).map((inner) => shift(inner));
  return features
    .filter(
      (f) =>
        f.geometry.type !== 'GeometryCollection' &&
        f.seen?.length &&
        f.seen.every((s) => s.map.kind === 'own' && s.map.id === mapId),
    )
    .map((f) => {
      const g = f.geometry as Exclude<Geometry, { type: 'GeometryCollection' }>;
      return { ...f, geometry: { ...g, coordinates: shift(g.coordinates as Coords) } as Geometry };
    });
}
