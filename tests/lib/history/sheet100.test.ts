import { describe, expect, it } from 'vitest';
import {
  buildSheet100Proposals,
  parseMapObjects,
  READ_PROFILES,
  type MapObject,
  type ReadKind,
} from '@/shared/lib/history';

const g = { originE: 300_000, originN: 400_000, res: 8, w: 400, h: 400 };
const opts = { bufferM: 25, linkM: 80, minConfidence: 0.5, coarseResM: 4 };
const obj = (kind: ReadKind, x: number, y: number, label = '', confidence = 0.8) =>
  ({ kind, label, x, y, confidence }) as MapObject<ReadKind>;
const withBuildingAt = (cells: [number, number][]) => {
  const m = new Uint8Array(g.w * g.h);
  for (const [x, y] of cells) m[y * g.w + x] = 1;
  return m;
};

describe('the 1:100 000 sheet profile', () => {
  it('has no catch-all kind: a place name read as an object is dropped', () => {
    const kinds = READ_PROFILES.arkusz100.kinds;
    expect(kinds).not.toContain('inne');
    const objs = parseMapObjects(
      {
        objects: [
          { kind: 'inne', label: 'Reppersdorf', x: 10, y: 10, confidence: 0.9 },
          { kind: 'karczma', label: 'Whs. z. Hoffnung', x: 20, y: 20, confidence: 0.8 },
        ],
      },
      100,
      100,
      kinds,
    );
    expect(objs.map((o) => o.kind)).toEqual(['karczma']);
    expect(READ_PROFILES.arkusz100.prompt(1568, 1568, 8)).toMatch(/NOT the name/);
  });

  it('a village counts only when lost; a standing one is nothing to look for', () => {
    const today = withBuildingAt([[100, 110]]); // 80 m from Reppersdorf's middle
    const ps = buildSheet100Proposals(
      [obj('wies', 100, 100, 'Reppersdorf'), obj('wies', 300, 300, 'Altdorf')],
      today,
      g,
      opts,
    );
    expect(ps).toEqual([
      expect.objectContaining({ kind: 'osada', title: 'Zaginiona wieś: Altdorf', lost: true }),
    ]);
  });

  it('places by their symbol: an inn standing or not, a chapel only when gone', () => {
    const today = withBuildingAt([
      [50, 50],
      [200, 200],
    ]);
    const ps = buildSheet100Proposals(
      [
        obj('karczma', 50, 50, 'Whs.'),
        obj('kosciol', 200, 200, 'Kap.'),
        obj('mlyn', 250, 250, 'M.', 0.3),
      ],
      today,
      g,
      opts,
    );
    expect(ps.map((p) => p.title)).toEqual(['Karczma: Whs.']);
  });
});
