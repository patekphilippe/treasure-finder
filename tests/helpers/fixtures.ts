import type { FieldPoint, Track } from '@/shared/types/domain';

export function makePoint(overrides: Partial<FieldPoint> = {}): FieldPoint {
  return {
    id: 'p1',
    type: 'anomalia',
    status: 'do_sprawdzenia',
    name: 'Punkt',
    desc: '',
    depthCm: null,
    lat: 52.1,
    lng: 19.4,
    accM: 4,
    src: 'gps',
    photoId: null,
    created: 1_700_000_000_000,
    updated: 1_700_000_000_000,
    ...overrides,
  };
}

export function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1',
    name: 'Trasa',
    start: 1_700_000_000_000,
    end: null,
    active: false,
    distM: 0,
    segments: [[]],
    ...overrides,
  };
}
