import type { NewPointInput } from '@/features/points';
import type { Candidate } from '@/shared/types/domain';
import { FORM_META } from '../config/forms';
import { describeCandidate } from './describeCandidate';

/** Point to check for an accepted candidate: "Zagłębienie okrągłe 12 (ocena 73)". */
export function candidatePointInput(c: Candidate): NewPointInput {
  const number = Number.parseInt(c.id.split('-').pop() ?? '', 10);
  const label = FORM_META[c.form].label;
  const name = `${label}${Number.isFinite(number) ? ` ${number}` : ''} (ocena ${c.score})`;
  return {
    type: 'anomalia',
    status: 'do_sprawdzenia',
    name,
    desc: [describeCandidate(c), c.sheetId && `arkusz ${c.sheetId}`, c.note]
      .filter(Boolean)
      .join(' · '),
    depthCm: null,
    lat: c.lat,
    lng: c.lng,
    accM: null,
    src: 'analiza',
    candidateId: c.id,
    photoId: null,
  };
}
