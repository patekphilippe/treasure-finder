import type { Track } from '@/shared/types/domain';

/** After the app is reopened, recording continues in a fresh segment. */
export function resumeTrack(track: Track): Track {
  const last = track.segments[track.segments.length - 1];
  if (last && last.length === 0) return track;
  return { ...track, segments: [...track.segments, []] };
}
