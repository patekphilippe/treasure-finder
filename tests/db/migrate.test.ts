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
    const v2 = await openDB(name, 2, { upgrade: (db, old) => migrate(db as never, old) });
    expect(await v2.get('points', 'p1')).toEqual({ id: 'p1' });
    expect([...v2.objectStoreNames]).toContain('areas');
    v2.close();
  });
});
