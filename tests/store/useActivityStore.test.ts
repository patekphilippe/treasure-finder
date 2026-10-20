import { beforeEach, describe, expect, it } from 'vitest';
import { trackActivity } from '@/shared/store/trackActivity';
import { useActivityStore } from '@/shared/store/useActivityStore';

const tasks = () => useActivityStore.getState().tasks;

describe('activity store', () => {
  beforeEach(() => useActivityStore.setState({ tasks: [] }));

  it('starts, updates and ends a task; starting it again keeps its start time', () => {
    const { upsert, update, end } = useActivityStore.getState();
    upsert({ id: 'nmt', label: 'Arkusz NMT a.asc', short: 'Arkusz NMT' }, 100);
    expect(tasks()).toEqual([
      {
        id: 'nmt',
        label: 'Arkusz NMT a.asc',
        short: 'Arkusz NMT',
        share: null,
        step: null,
        cancel: null,
        open: null,
        startedAt: 100,
      },
    ]);
    update('nmt', { share: 0.4, step: 'Rozpoznawanie form' });
    upsert({ id: 'nmt', label: 'Arkusz NMT a.asc', short: 'Arkusz NMT', share: 0.5 }, 200);
    expect(tasks()[0]).toMatchObject({ share: 0.5, step: 'Rozpoznawanie form', startedAt: 100 });
    upsert({ id: 'ai', label: 'Odczyt mapy', short: 'Odczyt mapy' });
    end('nmt');
    expect(tasks().map((t) => t.id)).toEqual(['ai']);
  });

  it('a tracked task shows while it runs and ends however it ends', async () => {
    let during: number | null = null;
    const r = await trackActivity({ id: 'x', label: 'Import', short: 'Import' }, async (update) => {
      update({ share: 0.5 });
      during = tasks()[0]!.share;
      return 7;
    });
    expect(r).toBe(7);
    expect(during).toBe(0.5);
    expect(tasks()).toEqual([]);
    await expect(
      trackActivity({ id: 'y', label: 'Eksport', short: 'Eksport' }, async () => {
        throw new Error('nie');
      }),
    ).rejects.toThrow('nie');
    expect(tasks()).toEqual([]);
  });
});
