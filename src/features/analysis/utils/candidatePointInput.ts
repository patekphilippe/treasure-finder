import type { NewPointInput } from '@/features/points';
import { INTERPRETATIONS } from '@/shared/lib/detect';
import { geometryCentroid } from '@/shared/lib/geo';
import type { Candidate } from '@/shared/types/domain';
import { describeCandidate } from './describeCandidate';

/** Point to check for an accepted candidate, in the middle of its search zone: "Okop 12 (ocena 73)". */
export function candidatePointInput(c: Candidate): NewPointInput {
  const number = Number.parseInt(c.id.split('-').pop() ?? '', 10);
  const label = INTERPRETATIONS[c.interpretation].label;
  const name = `${label}${Number.isFinite(number) ? ` ${number}` : ''} (ocena ${c.score})`;
  const at = c.searchZone ? geometryCentroid(c.searchZone) : { lat: c.lat, lng: c.lng };
  return {
    type: 'anomalia',
    status: 'do_sprawdzenia',
    name,
    desc: [describeCandidate(c), ...c.reasons, c.sheetId && `arkusz ${c.sheetId}`, c.note]
      .filter(Boolean)
      .join('. '),
    depthCm: null,
    lat: at.lat,
    lng: at.lng,
    accM: null,
    src: 'analiza',
    candidateId: c.id,
    photoId: null,
  };
}
