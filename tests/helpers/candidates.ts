import type { Candidate } from '@/shared/types/domain';

export function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'M-33-33-B-d-3-1-0012',
    sheetId: 'M-33-33-B-d-3-1',
    form: 'zaglebienie_okragle',
    lat: 51.2,
    lng: 16.38,
    areaM2: 20.4,
    lengthM: 6,
    widthM: 4.2,
    reliefM: -1.12,
    circularity: 0.82,
    elongation: 1.43,
    rectangularity: 0.8,
    score: 73,
    protectedLikely: false,
    decision: 'nowy',
    note: '',
    ...overrides,
  };
}

/** Same shape as qgis/detect.py output. */
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
