import { MAP_OBJECT_KINDS, type MapObject, type MapObjectKind } from './types';

/** The reading tool's input → valid objects inside the image (anything malformed is dropped). */
export function parseMapObjects(input: unknown, w: number, h: number): MapObject[] {
  const list = (input as { objects?: unknown })?.objects;
  if (!Array.isArray(list)) return [];
  const out: MapObject[] = [];
  for (const o of list as Record<string, unknown>[]) {
    const x = Number(o?.x);
    const y = Number(o?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > w || y > h) continue;
    const kind = (MAP_OBJECT_KINDS as readonly string[]).includes(String(o.kind))
      ? (o.kind as MapObjectKind)
      : 'inne';
    const c = Number(o.confidence);
    out.push({
      kind,
      label: typeof o.label === 'string' ? o.label.slice(0, 60) : '',
      x,
      y,
      confidence: Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.5,
    });
  }
  return out;
}
