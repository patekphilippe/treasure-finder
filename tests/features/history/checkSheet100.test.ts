import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapObject, ReadKind } from '@/shared/lib/history';

type Answer = MapObject<ReadKind>[] | Error;
let answers: Answer[] = [];
const asked: { w: number; res: number; profile: string }[] = [];
vi.mock('@/features/history/services/readMapWithAi', () => ({
  readMapWithAi: async (
    _i: Blob,
    w: number,
    _h: number,
    res: number,
    _m: string,
    profile: string,
  ) => {
    asked.push({ w, res, profile });
    const a = answers.shift() ?? [];
    if (a instanceof Error) throw a;
    return { objects: a, usage: { inputTokens: 10, outputTokens: 2 } };
  },
}));
// the browser's image API (the close-ups are drawn on a canvas)
vi.stubGlobal('createImageBitmap', async () => ({ close: () => {} }));
vi.stubGlobal(
  'OffscreenCanvas',
  class {
    getContext() {
      return { fillRect: () => {}, drawImage: () => {} };
    }
    async convertToBlob() {
      return new Blob(['x']);
    }
  },
);

const { checkSheet100 } = await import('@/features/history/services/checkSheet100');

const grid = { originE: 300_000, originN: 400_000, res: 8, w: 1568, h: 1568 };
const spot = (kind: ReadKind, x: number, y: number) =>
  ({ kind, label: '', x, y, confidence: 0.8 }) as MapObject<ReadKind>;
const centre = 192; // 128 px enlarged 3×

describe('the second look at a 1:100 000 sheet', () => {
  beforeEach(() => {
    answers = [];
    asked.length = 0;
  });

  it('keeps a spot confirmed at the centre, moved onto the symbol; a name gets nothing', async () => {
    answers = [
      [], // the "inn" on the letters of Reppersdorf: only a name there
      [spot('mlyn', centre + 30, centre)], // the mill, 10 px of the view off
    ];
    const r = await checkSheet100(
      new Blob(),
      grid,
      [spot('karczma', 400, 400), spot('mlyn', 600, 600)],
      'claude-haiku-5-5',
    );
    expect(r.confirmed).toEqual([expect.objectContaining({ kind: 'mlyn', x: 610, y: 600 })]);
    expect(asked[0]).toEqual({ w: 384, res: 8 / 3, profile: 'arkusz100_sprawdz' });
    expect(r.usage).toEqual({ inputTokens: 20, outputTokens: 4 });
  });

  it('another kind, or a symbol off the centre, is no confirmation', async () => {
    answers = [[spot('kosciol', centre, centre)], [spot('mlyn', 10, 10)]];
    const r = await checkSheet100(
      new Blob(),
      grid,
      [spot('mlyn', 400, 400), spot('mlyn', 600, 600)],
      'claude-haiku-5-5',
    );
    expect(r.confirmed).toEqual([]);
  });

  it('a daily limit stops the reading', async () => {
    answers = [new Error('Dzienny limit odczytów map został wykorzystany, spróbuj jutro')];
    await expect(
      checkSheet100(new Blob(), grid, [spot('mlyn', 400, 400)], 'claude-haiku-5-5'),
    ).rejects.toThrow(/limit/);
  });
});
