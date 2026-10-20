import { MAP_OBJECT_KINDS, type MapObject, type MapObjectKind } from './types';

/** points kept from one line: enough to follow a front line across the view */
const MAX_LINE_POINTS = 60;

/**
 * The reading's JSON → valid objects inside the image (anything malformed is dropped). `kinds`:
 * what the profile may report (others become "inne"); line points outside the image are dropped.
 */
export function parseMapObjects<K extends string = MapObjectKind>(
  input: unknown,
  w: number,
  h: number,
  // every profile's kinds include "inne", the fallback
  kinds: readonly K[] = MAP_OBJECT_KINDS as unknown as readonly K[],
): MapObject<K>[] {
  const list = (input as { objects?: unknown })?.objects;
  if (!Array.isArray(list)) return [];
  const inside = (x: number, y: number) =>
    Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= w && y <= h;
  const out: MapObject<K>[] = [];
  for (const o of list as Record<string, unknown>[]) {
    const x = Number(o?.x);
    const y = Number(o?.y);
    if (!inside(x, y)) continue;
    const kind = (kinds as readonly string[]).includes(String(o.kind))
      ? (o.kind as K)
      : ('inne' as K);
    const c = Number(o.confidence);
    const object: MapObject<K> = {
      kind,
      label: typeof o.label === 'string' ? o.label.slice(0, 60) : '',
      x,
      y,
      confidence: Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.5,
    };
    if (Array.isArray(o.line)) {
      const line = (o.line as Record<string, unknown>[])
        .map((p) => ({ x: Number(p?.x), y: Number(p?.y) }))
        .filter((p) => inside(p.x, p.y))
        .slice(0, MAX_LINE_POINTS);
      if (line.length >= 2) object.line = line;
    }
    out.push(object);
  }
  return out;
}
