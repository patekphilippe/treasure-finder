import type { MultiPolygon, Polygon } from 'geojson';
import type {
  AlternativeInterpretation,
  Candidate,
  CandidateDecision,
  FormKind,
  Interpretation,
  Priority,
} from '@/shared/types/domain';
import { INTERPRETATIONS, FORMS, PRIORITIES } from '../detect/vocabulary';
import { isLatLng, isRecord, num, str } from './guards';
import { ImportError } from './parseBackup';

export const INTERPRETATION_VALUES = Object.keys(INTERPRETATIONS) as Interpretation[];
const FORM_VALUES = Object.keys(FORMS) as FormKind[];
const PRIORITY_VALUES = Object.keys(PRIORITIES) as Priority[];
const DECISIONS: readonly CandidateDecision[] = ['nowy', 'przyjety', 'odrzucony'];
export const RECOMPUTE_REASON =
  'Wynik starej analizy. Wczytaj arkusz ponownie, aby rozpoznać formę.';

/** kandydaci.geojson (this app or the older QGIS script): has an id and a score. */
export function isCandidatesGeoJSON(json: unknown): boolean {
  if (!isRecord(json) || json.type !== 'FeatureCollection' || !Array.isArray(json.features))
    return false;
  const first = json.features[0];
  return (
    isRecord(first) &&
    isRecord(first.properties) &&
    'score' in first.properties &&
    ('interpretation' in first.properties || 'form' in first.properties)
  );
}

const polygon = (v: unknown): Polygon | MultiPolygon | null =>
  isRecord(v) && (v.type === 'Polygon' || v.type === 'MultiPolygon') && Array.isArray(v.coordinates)
    ? (v as unknown as Polygon | MultiPolygon)
    : null;

/** Point features → Candidates. Old-format candidates are kept but marked for recomputation. */
export function importCandidatesGeoJSON(json: unknown): {
  candidates: Candidate[];
  skipped: number;
} {
  if (!isCandidatesGeoJSON(json))
    throw new ImportError('To nie jest plik kandydatów (brak pól interpretation i score)');
  const features = (json as { features: unknown[] }).features;
  const candidates: Candidate[] = [];
  for (const f of features) {
    const g = isRecord(f) && isRecord(f.geometry) ? f.geometry : null;
    const p = isRecord(f) && isRecord(f.properties) ? f.properties : null;
    const coords = g?.type === 'Point' && Array.isArray(g.coordinates) ? g.coordinates : null;
    const lng = coords ? num(coords[0]) : null;
    const lat = coords ? num(coords[1]) : null;
    const score = num(p?.score);
    const id = str(p?.id);
    if (!p || !id || !isLatLng(lat, lng) || score === null) continue;
    const isNew = INTERPRETATION_VALUES.includes(p.interpretation as Interpretation);
    const flags = isRecord(p.flags) ? p.flags : {};
    const alternatives = Array.isArray(p.alternatives)
      ? p.alternatives
          .filter((a): a is Record<string, unknown> => isRecord(a))
          .filter((a) => INTERPRETATION_VALUES.includes(a.interpretation as Interpretation))
          .map((a): AlternativeInterpretation => ({
            interpretation: a.interpretation as Interpretation,
            confidence: num(a.confidence) ?? 0,
          }))
      : [];
    candidates.push({
      id,
      sheetId: str(p.sheetId),
      form: FORM_VALUES.includes(p.form as FormKind) ? (p.form as FormKind) : 'pojedynczy_dol',
      interpretation: isNew ? (p.interpretation as Interpretation) : 'nieokreslona',
      confidence: isNew ? Math.min(1, Math.max(0, num(p.confidence) ?? 0)) : 0,
      alternatives: isNew ? alternatives.slice(0, 2) : [],
      priority: PRIORITY_VALUES.includes(p.priority as Priority)
        ? (p.priority as Priority)
        : p.protectedLikely === true
          ? 'chroniony'
          : 'niski',
      flags: { uxo: flags.uxo === true, warGraves: flags.warGraves === true },
      reasons:
        isNew && Array.isArray(p.reasons) ? p.reasons.map(str).filter(Boolean) : [RECOMPUTE_REASON],
      lat: lat as number,
      lng: lng as number,
      areaM2: num(p.areaM2) ?? 0,
      lengthM: num(p.lengthM) ?? 0,
      widthM: num(p.widthM) ?? 0,
      reliefM: num(p.reliefM) ?? 0,
      score: Math.max(0, Math.min(100, Math.round(score))),
      outline: polygon(p.outline),
      searchZone: polygon(p.searchZone),
      exclusionZone: polygon(p.exclusionZone),
      decision: DECISIONS.includes(p.decision as CandidateDecision)
        ? (p.decision as CandidateDecision)
        : 'nowy',
      note: str(p.note),
      ...(!isNew && { needsRecompute: true }),
    });
  }
  return { candidates, skipped: features.length - candidates.length };
}
