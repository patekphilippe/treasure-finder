import { createId } from '@/shared/lib/createId';
import type { Track } from '@/shared/types/domain';

const NAME_FORMAT = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function createTrack(now: number): Track {
  return {
    id: createId(),
    name: `Trasa ${NAME_FORMAT.format(now)}`,
    start: now,
    end: null,
    active: true,
    distM: 0,
    segments: [[]],
  };
}
