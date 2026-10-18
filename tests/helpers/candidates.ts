import type { Candidate } from '@/shared/types/domain';

export function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'M-33-33-B-d-3-1-0012',
    sheetId: 'M-33-33-B-d-3-1',
    form: 'pojedynczy_dol',
    interpretation: 'leje',
    confidence: 0.8,
    alternatives: [{ interpretation: 'wyrobisko', confidence: 0.3 }],
    priority: 'niski',
    flags: { uxo: true, warGraves: true },
    reasons: ['wał dookoła całego dołu'],
    lat: 51.2,
    lng: 16.38,
    areaM2: 20.4,
    lengthM: 6,
    widthM: 4.2,
    reliefM: -1.12,
    score: 73,
    outline: null,
    searchZone: null,
    exclusionZone: null,
    decision: 'nowy',
    note: '',
    ...overrides,
  };
}

/** Same shape as the export of this app. */
export function candidatesGeoJSON(list: Candidate[]) {
  return {
    type: 'FeatureCollection',
    features: list.map(({ lat, lng, ...props }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: props,
    })),
  };
}
