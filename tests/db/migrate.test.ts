import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/shared/db/getDb';

describe('IndexedDB schema v1', () => {
  it('creates all eight stores', async () => {
    const db = await getDb();
    expect([...db.objectStoreNames].sort()).toEqual([
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
});
