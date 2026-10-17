import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { pointsRepo } from '@/shared/db';
import { clearDb } from '../helpers/clearDb';
import { makePoint } from '../helpers/fixtures';

describe('pointsRepo', () => {
  beforeEach(clearDb);

  it('saves and reads a point', async () => {
    await pointsRepo.put(makePoint({ id: 'a', name: 'Lej' }));
    expect(await pointsRepo.get('a')).toMatchObject({ id: 'a', name: 'Lej' });
  });

  it('lists and removes points', async () => {
    await pointsRepo.putMany([makePoint({ id: 'a' }), makePoint({ id: 'b' })]);
    expect(await pointsRepo.getAll()).toHaveLength(2);
    await pointsRepo.remove('a');
    expect((await pointsRepo.getAll()).map((p) => p.id)).toEqual(['b']);
  });
});
