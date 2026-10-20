import type { FieldPoint, OwnMap, Track } from '@/shared/types/domain';

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

export function makeOwnMap(overrides: Partial<OwnMap> = {}): OwnMap {
  return {
    id: 'm1',
    name: 'Messtischblatt 5260',
    created: 1_700_000_000_000,
    image: new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2])], { type: 'image/webp' }),
    width: 4000,
    height: 3000,
    pixelToSource: [2, 0, 300000, 0, -2, 400000, 0, 0, 1],
    epsg: 2180,
    method: 'corners',
    visible: true,
    opacity: 0.8,
    ...overrides,
  };
}
