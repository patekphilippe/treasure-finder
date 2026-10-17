import { describe, expect, it } from 'vitest';
import { createPoint } from '@/features/points/utils/createPoint';
import { defaultPointName } from '@/features/points/utils/defaultPointName';
import { makePoint } from '../../helpers/fixtures';

const base = {
  type: 'anomalia' as const,
  name: 'A',
  desc: '',
  depthCm: null,
  lat: 52,
  lng: 19,
  accM: 4,
  photoId: null,
};

describe('createPoint', () => {
  it('fills defaults', () => {
    const p = createPoint({ ...base, src: 'gps' }, 123);
    expect(p).toMatchObject({ status: 'do_sprawdzenia', created: 123, updated: 123, accM: 4 });
    expect(p.id).toMatch(/[0-9a-f-]{36}/);
  });

  it('drops accuracy for points placed on the map', () => {
    expect(createPoint({ ...base, src: 'mapa' }, 0).accM).toBeNull();
  });

  it('keeps an explicit status and candidate id', () => {
    const p = createPoint({ ...base, src: 'analiza', status: 'chroniony', candidateId: 'c1' }, 0);
    expect(p).toMatchObject({ status: 'chroniony', candidateId: 'c1' });
  });
});

describe('defaultPointName', () => {
  it('numbers points per type', () => {
    const existing = [
      makePoint({ id: 'a', type: 'anomalia' }),
      makePoint({ id: 'b', type: 'inne' }),
    ];
    expect(defaultPointName('anomalia', existing)).toBe('Anomalia 2');
    expect(defaultPointName('znalezisko', existing)).toBe('Znalezisko 1');
  });
});
