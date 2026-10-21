import { beforeEach, describe, expect, it, vi } from 'vitest';
import { wholeMapChunks } from '@/features/history/utils/wholeMapChunks';
import { toEpsg2180 } from '@/shared/lib/geo';
import { gridSheetAt } from '@/shared/lib/georef';
import {
  buildSheet100Proposals,
  parseLegend,
  type MapObject,
  type ReadKind,
} from '@/shared/lib/history';
import { makeOwnMap } from '../../helpers/fixtures';

let answers: (string[] | Error)[] = [];
const pieces: { w: number; h: number; profile: string }[] = [];
vi.mock('@/features/history/services/readMapWithAi', () => ({
  readMapWithAi: async (
    _i: Blob,
    w: number,
    h: number,
    _r: number,
    _m: string,
    profile: string,
  ) => {
    pieces.push({ w, h, profile });
    const a = answers.shift() ?? [];
    if (a instanceof Error) throw a;
    return { objects: [], usage: { inputTokens: 1, outputTokens: 1 }, legend: a };
  },
}));
vi.stubGlobal('createImageBitmap', async () => ({ width: 4600, height: 3400, close: () => {} }));
vi.stubGlobal(
  'OffscreenCanvas',
  class {
    getContext() {
      return { drawImage: () => {} };
    }
    async convertToBlob() {
      return new Blob(['x']);
    }
  },
);
const { readMapLegend } = await import('@/features/history/services/readMapLegend');

describe('the sheet’s own legend', () => {
  beforeEach(() => {
    answers = [];
    pieces.length = 0;
  });

  it('is read from the right and bottom margins, in pieces the reading takes', async () => {
    answers = [['M.: Młyn wodny', 'Kr.: Karczma'], [], ['M.: Młyn wodny'], new Error('timeout')];
    const legend = await readMapLegend(makeOwnMap(), 'claude-haiku-5-5');
    expect(legend).toBe('M.: Młyn wodny\nKr.: Karczma');
    // right margin 1150 × 3400 in 3 rows, bottom 3450 × 612 in 3 columns
    expect(pieces).toHaveLength(6);
    expect(pieces.every((p) => p.profile === 'legenda' && p.w <= 1568 && p.h <= 1568)).toBe(true);
  });

  it('none found: null; a daily limit stops it', async () => {
    expect(await readMapLegend(makeOwnMap(), 'claude-haiku-5-5')).toBeNull();
    answers = [new Error('Dzienny limit odczytów map został wykorzystany')];
    await expect(readMapLegend(makeOwnMap(), 'claude-haiku-5-5')).rejects.toThrow(/limit/);
  });

  it('entries without a sign or meaning are dropped', () => {
    expect(
      parseLegend({
        entries: [
          { sign: ' Kr. ', meaning: 'Karczma' },
          { sign: 'x', meaning: '' },
        ],
      }),
    ).toEqual(['Kr.: Karczma']);
    expect(parseLegend(null)).toEqual([]);
  });
});

describe('a 1:100 000 sheet is read inside its frame', () => {
  it('the margin around the 30′ × 15′ cell gets no windows', () => {
    // a scan of Liegnitz with ~3 km of margin around its cell, 8 m a pixel
    const cell = gridSheetAt(51.2, 16.2);
    const [w, n] = toEpsg2180(cell.north + 0.03, cell.west - 0.045);
    const map = makeOwnMap({
      width: 5000,
      height: 4200,
      pixelToSource: [8, 0, w, 0, -8, n, 0, 0, 1],
    });
    const inside = wholeMapChunks(map, 'arkusz100')!;
    const all = wholeMapChunks(map, 'topo')!;
    expect(inside.length).toBeLessThan(all.length);
    for (const b of inside) {
      expect(b.north).toBeLessThanOrEqual(cell.north);
      expect(b.south).toBeGreaterThanOrEqual(cell.south);
      expect(b.west).toBeGreaterThanOrEqual(cell.west);
      expect(b.east).toBeLessThanOrEqual(cell.east);
    }
  });

  it('an overview map as coarse is not cut to one sheet', () => {
    const [w, n] = toEpsg2180(51.6, 15.5);
    const map = makeOwnMap({
      width: 5000,
      height: 4000,
      pixelToSource: [20, 0, w, 0, -20, n, 0, 0, 1], // 100 × 80 km
    });
    expect(wholeMapChunks(map, 'arkusz100')).toHaveLength(wholeMapChunks(map, 'topo')!.length);
  });
});

describe('places the legend adds', () => {
  it('a battlefield, ruins and a windmill gone today are proposed', () => {
    const g = { originE: 300_000, originN: 400_000, res: 8, w: 400, h: 400 };
    const obj = (kind: ReadKind, x: number) =>
      ({ kind, label: '', x, y: 100, confidence: 0.8 }) as MapObject<ReadKind>;
    const ps = buildSheet100Proposals(
      [obj('pobojowisko', 50), obj('ruiny', 150), obj('wiatrak', 250)],
      new Uint8Array(g.w * g.h),
      g,
      { bufferM: 25, linkM: 80, minConfidence: 0.5, coarseResM: 4 },
    );
    expect(ps.map((p) => [p.kind, p.title])).toEqual([
      ['inne', 'Pobojowisko, dziś bez zabudowy'],
      ['inne', 'Ruiny, dziś bez zabudowy'],
      ['mlyn', 'Wiatrak, dziś bez zabudowy'],
    ]);
  });
});
