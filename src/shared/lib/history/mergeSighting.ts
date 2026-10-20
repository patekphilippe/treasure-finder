import type { ContextFeature, Sighting } from '@/shared/types/domain';
import { haversine } from '../geo/haversine';
import { sameMap } from './sameMap';

export interface MergeOptions {
  /** seen on another map: the same object within this distance */
  mergeM: number;
  /** seen on the same map again: the same object only within this distance */
  duplicateM: number;
  /** the maps an object was seen on (an older object: read from its description) */
  sightingsOf: (f: ContextFeature) => Sighting[];
}

export type MergeResult =
  /** nothing like it nearby: a new object */
  | { result: 'new'; feature: ContextFeature }
  /** the same object, now with the maps it was not known on yet */
  | { result: 'merged'; feature: ContextFeature; distM: number }
  /** the same object seen on the same maps: nothing to add */
  | { result: 'duplicate'; feature: ContextFeature; distM: number };

/** kinds that cover different things: a forester's lodge and a brickworks are both "inne" */
const BROAD: readonly ContextFeature['kind'][] = ['inne', 'wojsko'];

const labelKey = (f: ContextFeature) => (f.label ?? '').split(/[:,(]/)[0]!.trim().toLowerCase();

const pointOf = (f: ContextFeature) =>
  f.geometry.type === 'Point' ? (f.geometry.coordinates as [number, number]) : null;

/**
 * One object, many maps: an object about to be added, matched against the objects there are.
 * A point of the same kind (and, for broad kinds, the same name) within `mergeM` seen on
 * other maps is the same object and takes the new maps; on a map it was already seen on it
 * matches only within `duplicateM`, so two mills on one map stay two. Lines and areas are
 * never merged, and objects of other community members are never changed. The object keeps
 * its place unless it is first marked by hand; its description (`source`) stays as it was.
 */
export function mergeSighting(
  existing: readonly ContextFeature[],
  incoming: ContextFeature,
  opts: MergeOptions,
): MergeResult {
  const at = pointOf(incoming);
  if (!at) return { result: 'new', feature: incoming };
  const seen = opts.sightingsOf(incoming);
  const key = labelKey(incoming);

  let best: { f: ContextFeature; known: Sighting[]; distM: number } | null = null;
  for (const f of existing) {
    const p = pointOf(f);
    if (!p || f.kind !== incoming.kind || f.id === incoming.id) continue;
    if (f.community && !f.community.mineAuthor) continue;
    if (BROAD.includes(f.kind) && (key === '' || labelKey(f) !== key)) continue;
    const distM = haversine(at[1], at[0], p[1], p[0]);
    const known = opts.sightingsOf(f);
    const shared = seen.some((s) => known.some((k) => sameMap(k.map, s.map)));
    if (distM > (shared ? opts.duplicateM : opts.mergeM)) continue;
    if (!best || distM < best.distM) best = { f, known, distM };
  }
  if (!best) return { result: 'new', feature: incoming };

  const { f, known, distM } = best;
  const added = seen.filter((s) => !known.some((k) => sameMap(k.map, s.map)));
  if (added.length === 0) return { result: 'duplicate', feature: f, distM };
  const byHand = added.some((s) => s.how === 'reczne') && !known.some((k) => k.how === 'reczne');
  return {
    result: 'merged',
    feature: {
      ...f,
      ...(byHand && { geometry: incoming.geometry }),
      ...(!f.label && incoming.label && { label: incoming.label }),
      seen: [...known, ...added],
    },
    distM,
  };
}
