import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { tracksRepo } from '@/shared/db';
import { clearDb } from '../helpers/clearDb';
import { makeTrack } from '../helpers/fixtures';

describe('tracksRepo', () => {
  beforeEach(clearDb);

  it('returns only the active track', async () => {
    await tracksRepo.putMany([
      makeTrack({ id: 'old', active: false, end: 1 }),
      makeTrack({ id: 'live', active: true }),
    ]);
    expect((await tracksRepo.getActive())?.id).toBe('live');
  });

  it('returns undefined when nothing is recording', async () => {
    await tracksRepo.put(makeTrack({ active: false }));
    expect(await tracksRepo.getActive()).toBeUndefined();
  });

  it('removes a track', async () => {
    await tracksRepo.put(makeTrack({ id: 'x' }));
    await tracksRepo.remove('x');
    expect(await tracksRepo.getAll()).toEqual([]);
  });
});
