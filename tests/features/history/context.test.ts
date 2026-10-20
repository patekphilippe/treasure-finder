import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useContextStore } from '@/features/history/store/useContextStore';
import type { Proposal } from '@/features/history/services/findLostBuildings';
import { createContextPoint } from '@/features/history/utils/createContextPoint';
import { proposalToContext } from '@/features/history/utils/proposalToContext';
import { representativePoint } from '@/features/history/utils/representativePoint';
import { viewSighting } from '@/features/history/utils/viewSighting';
import { contextRepo } from '@/shared/db';
import type { Sighting } from '@/shared/types/domain';
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
    const seen: Sighting[] = [
      {
        map: { kind: 'wms', id: 'UMWD_Messtischblat_starsze', label: 'Messtischblatt (1883–1942)' },
        years: { from: 1883, to: 1942 },
        at: 1,
        how: 'reczne',
      },
    ];
    const mill = createContextPoint('mlyn', 50.77, 15.73, 'Messtischblatt (1883–1942)', seen);
    expect(mill.seen).toEqual(seen);
    expect(mill.geometry).toEqual({ type: 'Point', coordinates: [15.73, 50.77] });
    await useContextStore.getState().add([mill]);
    expect(await contextRepo.getAll()).toEqual([mill]);
    await useContextStore.getState().load();
    expect(useContextStore.getState().features).toEqual([mill]);
  });

  it('removes an object from the store and the database', async () => {
    const inn = createContextPoint('karczma', 51, 16, 'zaznaczone ręcznie', [
      { map: { kind: 'none', label: 'zaznaczone ręcznie' }, how: 'reczne' },
    ]);
    await useContextStore.getState().add([inn]);
    await useContextStore.getState().remove(inn.id);
    expect(useContextStore.getState().features).toEqual([]);
    expect(await contextRepo.getAll()).toEqual([]);
  });
});

describe('where an object was seen', () => {
  it('the map in view becomes a sighting with its years', () => {
    const ref = { kind: 'own' as const, id: 'm1', label: 'Mapa (własna mapa, 1936)' };
    expect(viewSighting({ ref, years: { from: 1936, to: 1936 } }, 'ai', 5)).toEqual({
      map: ref,
      years: { from: 1936, to: 1936 },
      at: 5,
      how: 'ai',
    });
    expect(viewSighting({ ref }, 'reczne', 5)).toEqual({ map: ref, at: 5, how: 'reczne' });
  });

  it('an accepted proposal keeps what the map says and the maps it was read on', () => {
    const seen: Sighting[] = [
      { map: { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' }, at: 1, how: 'ai' },
      {
        map: { kind: 'wms', id: 'UMWD_Messtischblat_nowsze', label: 'Messtischblatt' },
        years: { from: 1905, to: 1944 },
        at: 1,
        how: 'ai',
      },
    ];
    const p: Proposal = {
      id: 'p1',
      kind: 'mlyn',
      title: 'Młyn: Mühle (na obu mapach)',
      label: 'Młyn: Mühle',
      lat: 51,
      lng: 16,
      buildings: 0,
      lost: true,
      source: 'auto (AI, porównanie): Mapa (własna mapa) i Messtischblatt, młyn: mühle',
      seen,
    };
    expect(proposalToContext(p)).toMatchObject({
      kind: 'mlyn',
      geometry: { type: 'Point', coordinates: [16, 51] },
      source: p.source,
      label: 'Młyn: Mühle',
      seen,
    });
  });
});
