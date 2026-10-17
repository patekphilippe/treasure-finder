import { haversine } from '@/shared/lib/geo';
import type { GpsFix } from '@/shared/store/useFieldStore';
import type { Track } from '@/shared/types/domain';

/** Appends a fix to the last segment; distance only grows within a segment. */
export function appendFix(track: Track, fix: GpsFix): Track {
  const segments = track.segments.length ? track.segments.slice() : [[]];
  const lastIndex = segments.length - 1;
  const segment = segments[lastIndex] ?? [];
  const prev = segment[segment.length - 1];
  const step = prev ? haversine(prev[0], prev[1], fix.lat, fix.lng) : 0;
  segments[lastIndex] = [...segment, [fix.lat, fix.lng, fix.t, fix.accM]];
  return { ...track, segments, distM: track.distM + step };
}
