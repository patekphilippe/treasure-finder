import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/shared/db/getDb';

describe('IndexedDB schema v1', () => {
  it('creates all stores (v2 adds areas)', async () => {
    const db = await getDb();
    expect([...db.objectStoreNames].sort()).toEqual([
      'areas',
      'candidates',
      'context',
      'photos',
      'points',
      'rasters',
      'sheets',
      'tracks',
      'zones',
    ]);
  });

  it('upgrades a version 1 database without losing data', async () => {
    const { openDB } = await import('idb');
    const name = 'upgrade-test';
    const v1 = await openDB(name, 1, {
      upgrade: (db) => {
        db.createObjectStore('points', { keyPath: 'id' });
      },
    });
    await v1.put('points', { id: 'p1' });
    v1.close();
    const { migrate } = await import('@/shared/db/migrate');
    const v2 = await openDB(name, 2, {
      upgrade: (db, old, _n, tx) => migrate(db as never, old, tx as never),
    });
    expect(await v2.get('points', 'p1')).toEqual({ id: 'p1' });
    expect([...v2.objectStoreNames]).toContain('areas');
    v2.close();
  });

  it('v2 → v3 marks old candidates for recomputation, keeping decision and note', async () => {
    const { openDB } = await import('idb');
    const { migrate } = await import('@/shared/db/migrate');
    const name = 'upgrade-v3';
    const v2 = await openDB(name, 2, {
      upgrade: (db, old, _n, tx) => migrate(db as never, old, tx as never),
    });
    await v2.put('candidates', {
      id: 'c1',
      sheetId: 'S',
      form: 'kopiec_okragly',
      lat: 51.2,
      lng: 16.3,
      areaM2: 50,
      lengthM: 8,
      widthM: 7,
      reliefM: 0.9,
      circularity: 0.9,
      elongation: 1.1,
      rectangularity: 0.7,
      score: 70,
      protectedLikely: true,
      decision: 'odrzucony',
      note: 'notatka',
    });
    v2.close();
    const v3 = await openDB(name, 3, {
      upgrade: (db, old, _n, tx) => migrate(db as never, old, tx as never),
    });
    expect(await v3.get('candidates', 'c1')).toMatchObject({
      interpretation: 'nieokreslona',
      priority: 'chroniony',
      needsRecompute: true,
      decision: 'odrzucony',
      note: 'notatka',
      searchZone: null,
    });
    v3.close();
  });
});
