// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORICAL_LAYERS } from '@/features/layers/config/historicalLayers';
import { addSightedObjects } from '@/features/history/services/addSightedObjects';
import { useContextStore } from '@/features/history/store/useContextStore';
import { useOwnMapsStore } from '@/features/history/store/useOwnMapsStore';
import { addedToast } from '@/features/history/utils/addedToast';
import { createContextPoint } from '@/features/history/utils/createContextPoint';
import { knownMaps } from '@/features/history/utils/knownMaps';
import { sightingsOf } from '@/features/history/utils/sightingsOf';
import { contextRepo } from '@/shared/db';
import type { OwnMap, Sighting } from '@/shared/types/domain';
import { clearDb } from '../../helpers/clearDb';

const own: OwnMap = {
  id: 'm1',
  name: 'Wehrmacht',
  created: 0,
  image: new Blob(),
  width: 10,
  height: 10,
  pixelToSource: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  epsg: 2180,
  method: 'corners',
  visible: true,
  opacity: 0.8,
  year: 1944,
};
const older: Sighting = {
  map: {
    kind: 'wms',
    id: 'UMWD_Messtischblat_starsze',
    label: 'Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)',
  },
  years: { from: 1883, to: 1942 },
  at: 1,
  how: 'ai',
};
const onOwn: Sighting = {
  map: { kind: 'own', id: 'm1', label: 'Wehrmacht (własna mapa, 1944)' },
  years: { from: 1944, to: 1944 },
  at: 2,
  how: 'ai',
};

describe('adding objects to the one shared layer', () => {
  beforeEach(async () => {
    await clearDb();
    useContextStore.setState({ features: [] });
    useOwnMapsStore.setState({ maps: [own] });
  });

  it('the same map twice is skipped, another map is added to the object', async () => {
    const first = createContextPoint('mlyn', 50.9, 15.7, 'a', [older]);
    const one = await addSightedObjects([first]);
    expect(one).toMatchObject({ added: 1, merged: 0, duplicates: 0 });
    // the written objects come back (to share them, e.g. after an automatic reading)
    expect(one.changed.map((f) => f.id)).toEqual([first.id]);
    const again = createContextPoint('mlyn', 50.9001, 15.7, 'a', [older]);
    expect(await addSightedObjects([again])).toMatchObject({
      added: 0,
      merged: 0,
      duplicates: 1,
      changed: [],
    });
    const second = createContextPoint('mlyn', 50.9003, 15.7, 'b', [onOwn]);
    const pair = createContextPoint('karczma', 50.9, 15.7, 'b', [onOwn]);
    expect(await addSightedObjects([second, pair])).toMatchObject({
      added: 1,
      merged: 1,
      duplicates: 0,
    });

    const stored = await contextRepo.getAll();
    expect(stored).toHaveLength(2);
    expect(stored.find((f) => f.kind === 'mlyn')).toMatchObject({
      id: first.id,
      source: 'a',
      seen: [older, onOwn],
    });
    expect(useContextStore.getState().features).toHaveLength(2);
  });

  it('an object from before sightings: its map read from the description', async () => {
    const old = {
      id: 'old',
      kind: 'osada' as const,
      geometry: { type: 'Point' as const, coordinates: [15.7, 50.9] },
      source: 'auto (AI): Wehrmacht (własna mapa), zaginiona wieś (5 budynków)',
    };
    const known = knownMaps(HISTORICAL_LAYERS, [own]);
    expect(sightingsOf(old, known)).toEqual([
      { map: onOwn.map, how: 'ai', years: { from: 1944, to: 1944 } },
    ]);
    // another member's object never matches this device's own maps
    const theirs = {
      ...old,
      community: { id: 'k', author: 'Jan', mineAuthor: false, up: 0, down: 0, mine: 0 as const },
    };
    expect(sightingsOf(theirs, known)[0]!.map.kind).toBe('none');

    await useContextStore.getState().add([old]);
    const r = await addSightedObjects([createContextPoint('osada', 50.9, 15.7, 'x', [older])]);
    expect(r.merged).toBe(1);
    expect((await contextRepo.getAll())[0]!.seen).toEqual([
      { map: onOwn.map, how: 'ai', years: { from: 1944, to: 1944 } },
      older,
    ]);
  });

  it('says what happened', () => {
    expect(addedToast({ added: 3, merged: 2, duplicates: 1 })).toBe(
      'Dodano 3, dopisano mapę do 2, pominięto 1 (już są z tej mapy)',
    );
    expect(addedToast({ added: 0, merged: 0, duplicates: 0 })).toBe('Nic nie dodano');
    expect(addedToast({ added: 1, merged: 0, duplicates: 0 }, 'młyn')).toBe('Dodano: młyn');
    expect(addedToast({ added: 0, merged: 1, duplicates: 0 }, 'karczma')).toBe(
      'Karczma: dopisano tę mapę do obiektu w pobliżu',
    );
    expect(addedToast({ added: 0, merged: 0, duplicates: 1 }, 'młyn')).toBe(
      'Młyn: obiekt z tej mapy już jest w pobliżu',
    );
  });
});
