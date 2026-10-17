import type { Track } from '@/shared/types/domain';

/** Marks a track as finished and drops empty segments. */
export function finishTrack(track: Track, now: number): Track {
  const segments = track.segments.filter((s) => s.length > 0);
  return { ...track, active: false, end: now, segments: segments.length ? segments : [[]] };
}
