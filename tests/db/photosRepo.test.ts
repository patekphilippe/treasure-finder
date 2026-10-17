import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { photosRepo } from '@/shared/db';
import { clearDb } from '../helpers/clearDb';

describe('photosRepo', () => {
  beforeEach(clearDb);

  it('stores a blob under its id', async () => {
    await photosRepo.put('ph1', new Blob(['jpeg'], { type: 'image/jpeg' }));
    const blob = await photosRepo.get('ph1');
    expect(blob).toBeDefined();
    expect(await photosRepo.getAllKeys()).toEqual(['ph1']);
  });

  it('removes a blob', async () => {
    await photosRepo.put('ph1', new Blob(['x']));
    await photosRepo.remove('ph1');
    expect(await photosRepo.get('ph1')).toBeUndefined();
  });
});
