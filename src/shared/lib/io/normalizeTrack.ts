import type { Track, TrackVertex } from '@/shared/types/domain';
import { isLatLng, isRecord, num, str } from './guards';

/** [lat, lng, t, acc] or {lat, lng, t|time, acc|accM} → TrackVertex */
function vertex(raw: unknown): TrackVertex | null {
  const [lat, lng, t, acc] = Array.isArray(raw)
    ? [num(raw[0]), num(raw[1]), num(raw[2]), num(raw[3])]
    : isRecord(raw)
      ? [num(raw.lat), num(raw.lng), num(raw.t ?? raw.time), num(raw.acc ?? raw.accM)]
      : [null, null, null, null];
  if (!isLatLng(lat, lng)) return null;
  return [lat as number, lng as number, t ?? 0, acc ?? 0];
}

/**
 * Accepts a track from kopia.json v1 (dist) or v2 (distM). Segments may hold
 * vertex arrays or objects; a flat `points` list becomes one segment.
 * Imported tracks are never active, so another device does not resume them.
 */
export function normalizeTrack(raw: unknown): Track | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  if (!id) return null;

  const rawSegments: unknown[] = Array.isArray(raw.segments)
    ? raw.segments
    : Array.isArray(raw.points)
      ? [raw.points]
      : [];
  const segments = rawSegments
    .filter(Array.isArray)
    .map((seg) => seg.map(vertex).filter((v): v is TrackVertex => v !== null))
    .filter((seg) => seg.length > 0);

  const first = segments[0]?.[0];
  const lastSeg = segments[segments.length - 1];
  const last = lastSeg?.[lastSeg.length - 1];
  const start = num(raw.start) ?? first?.[2] ?? 0;

  return {
    id,
    name: str(raw.name) || 'Trasa',
    start,
    end: num(raw.end) ?? last?.[2] ?? start,
    active: false,
    distM: num(raw.distM ?? raw.dist) ?? 0,
    segments: segments.length ? segments : [[]],
  };
}
