import { describe, expect, it } from 'vitest';
import { planMapSync } from '@/features/history/utils/planMapSync';
import { sharedToOwnMap } from '@/features/history/utils/sharedToOwnMap';
import type { SharedMap } from '@/shared/types/community';
import { makeOwnMap } from '../../helpers/fixtures';

const remote = (id: string, patch: Partial<SharedMap> = {}): SharedMap => ({
  id,
  name: `Mapa ${id}`,
  year: 1921,
  width: 4000,
  height: 3000,
  pixelToSource: [2, 0, 300000, 0, -2, 400000, 0, 0, 1],
  epsg: 2180,
  method: 'corners',
  mime: 'image/webp',
  bytes: 1000,
  author: 'Anna',
  mine: false,
  readAt: null,
  updatedAt: 100,
  ...patch,
});

describe('planMapSync', () => {
  it('downloads new maps, updates changed ones, drops removed ones, sends maps only here', () => {
    const local = [
      makeOwnMap({ id: 'same', shared: { mine: false, author: 'Anna', updatedAt: 100 } }),
      makeOwnMap({ id: 'moved', shared: { mine: true, author: 'Ja', updatedAt: 100 } }),
      makeOwnMap({ id: 'gone', shared: { mine: false, author: 'Anna', updatedAt: 50 } }),
      makeOwnMap({ id: 'local' }),
    ];
    const plan = planMapSync(local, [
      remote('same'),
      remote('moved', { mine: true, year: 1936, readAt: 7, updatedAt: 200 }),
      remote('new'),
    ]);
    expect(plan.download.map((r) => r.id)).toEqual(['new']);
    expect(plan.update).toEqual([
      {
        id: 'moved',
        patch: expect.objectContaining({
          year: 1936,
          readAt: 7,
          shared: { mine: true, author: 'Anna', updatedAt: 200 },
        }),
      },
    ]);
    expect(plan.remove).toEqual(['gone']);
    expect(plan.upload).toEqual(['local']);
  });

  it('a downloaded map: the author’s own shown at once, others’ to switch on', () => {
    const image = new Blob([new Uint8Array([1])], { type: 'image/webp' });
    expect(sharedToOwnMap(remote('a', { mine: true }), image, 5)).toMatchObject({
      visible: true,
      year: 1921,
    });
    expect(sharedToOwnMap(remote('b'), image, 5)).toMatchObject({
      visible: false,
      shared: { mine: false, author: 'Anna', updatedAt: 100 },
    });
  });
});
