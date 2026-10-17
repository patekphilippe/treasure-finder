import type { Candidate, CandidateDecision, FormClass } from '@/shared/types/domain';
import { isLatLng, isRecord, num, str } from './guards';
import { ImportError } from './parseBackup';

export const FORM_VALUES: readonly FormClass[] = [
  'kopiec_okragly',
  'zaglebienie_okragle',
  'zaglebienie_prostokatne',
  'row_liniowy',
  'wal_liniowy',
  'pierscien',
  'nieokreslony',
];
const DECISIONS: readonly CandidateDecision[] = ['nowy', 'przyjety', 'odrzucony'];

/** kandydaci.geojson from qgis/detect.py (or this app's export): has `form` and `score`. */
export function isCandidatesGeoJSON(json: unknown): boolean {
  if (!isRecord(json) || json.type !== 'FeatureCollection' || !Array.isArray(json.features))
    return false;
  const first = json.features[0];
  return (
    isRecord(first) &&
    isRecord(first.properties) &&
    'form' in first.properties &&
    'score' in first.properties
  );
}

/** Point features → Candidates; invalid features are skipped and counted. */
export function importCandidatesGeoJSON(json: unknown): {
  candidates: Candidate[];
  skipped: number;
} {
  if (!isCandidatesGeoJSON(json))
    throw new ImportError('To nie jest plik kandydatów (brak pól form i score)');
  const features = (json as { features: unknown[] }).features;
  const candidates: Candidate[] = [];
  for (const f of features) {
    const g = isRecord(f) && isRecord(f.geometry) ? f.geometry : null;
    const p = isRecord(f) && isRecord(f.properties) ? f.properties : null;
    const coords = g?.type === 'Point' && Array.isArray(g.coordinates) ? g.coordinates : null;
    const lng = coords ? num(coords[0]) : null;
    const lat = coords ? num(coords[1]) : null;
    const form = p?.form as FormClass;
    const score = num(p?.score);
    const id = str(p?.id);
    if (!p || !id || !isLatLng(lat, lng) || !FORM_VALUES.includes(form) || score === null) continue;
    candidates.push({
      id,
      sheetId: str(p.sheetId),
      form,
      lat: lat as number,
      lng: lng as number,
      areaM2: num(p.areaM2) ?? 0,
      lengthM: num(p.lengthM) ?? 0,
      widthM: num(p.widthM) ?? 0,
      reliefM: num(p.reliefM) ?? 0,
      circularity: num(p.circularity) ?? 0,
      elongation: num(p.elongation) ?? 0,
      rectangularity: num(p.rectangularity) ?? 0,
      score: Math.max(0, Math.min(100, Math.round(score))),
      protectedLikely: p.protectedLikely === true,
      decision: DECISIONS.includes(p.decision as CandidateDecision)
        ? (p.decision as CandidateDecision)
        : 'nowy',
      note: str(p.note),
    });
  }
  return { candidates, skipped: features.length - candidates.length };
}
