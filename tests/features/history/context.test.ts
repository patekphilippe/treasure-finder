import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useContextStore } from '@/features/history/store/useContextStore';
import { createContextPoint } from '@/features/history/utils/createContextPoint';
import { representativePoint } from '@/features/history/utils/representativePoint';
import { contextRepo } from '@/shared/db';
import { clearDb } from '../../helpers/clearDb';

describe('representativePoint', () => {
  it('uses the point, the middle vertex of a line and the mean of a ring', () => {
    expect(representativePoint({ type: 'Point', coordinates: [16, 51] })).toEqual({
      lat: 51,
      lng: 16,
    });
    expect(
      representativePoint({
        type: 'LineString',
        coordinates: [
          [16, 51],
          [16.1, 51.1],
          [16.2, 51.2],
        ],
      }),
    ).toEqual({ lat: 51.1, lng: 16.1 });
    const square = representativePoint({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
      ],
    });
    expect(square).toEqual({ lat: 1, lng: 1 });
  });

  it('returns null for empty geometry', () => {
    expect(representativePoint({ type: 'Polygon', coordinates: [] })).toBeNull();
  });
});

describe('context store', () => {
  beforeEach(async () => {
    await clearDb();
    useContextStore.setState({ features: [] });
  });

  it('adds a hand-marked object as a GeoJSON point (lng, lat) and keeps it in IndexedDB', async () => {
    const mill = createContextPoint('mlyn', 50.77, 15.73, 'Messtischblatt (1883–1942)');
    expect(mill.geometry).toEqual({ type: 'Point', coordinates: [15.73, 50.77] });
    await useContextStore.getState().add([mill]);
    expect(await contextRepo.getAll()).toEqual([mill]);
    await useContextStore.getState().load();
    expect(useContextStore.getState().features).toEqual([mill]);
  });

  it('removes an object from the store and the database', async () => {
    const inn = createContextPoint('karczma', 51, 16, 'zaznaczone ręcznie');
    await useContextStore.getState().add([inn]);
    await useContextStore.getState().remove(inn.id);
    expect(useContextStore.getState().features).toEqual([]);
    expect(await contextRepo.getAll()).toEqual([]);
  });
});
