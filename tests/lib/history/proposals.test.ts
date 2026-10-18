import { describe, expect, it } from 'vitest';
import {
  buildProposals,
  clusterPoints,
  existsToday,
  parseMapObjects,
  type MapObject,
} from '@/shared/lib/history';

const g = { originE: 300_000, originN: 400_000, res: 2, w: 500, h: 500 };
const opts = { bufferM: 20, linkM: 80, minConfidence: 0.3 };
const house = (x: number, y: number, confidence = 0.8): MapObject => ({
  kind: 'budynek',
  label: '',
  x,
  y,
  confidence,
});
const withBuildingAt = (cells: [number, number][]) => {
  const m = new Uint8Array(g.w * g.h);
  for (const [x, y] of cells) m[y * g.w + x] = 1;
  return m;
};

describe('today’s buildings', () => {
  it('a building of BDOT10k within the buffer means the place still stands', () => {
    const mask = withBuildingAt([[105, 100]]);
    expect(existsToday(mask, g, 100, 100, 20)).toBe(true); // 10 m away
    expect(existsToday(mask, g, 100, 100, 8)).toBe(false);
    expect(existsToday(mask, g, 0, 0, 20)).toBe(false);
  });
});

describe('grouping', () => {
  it('chains of neighbours form one group, a far point its own', () => {
    const groups = clusterPoints(
      [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 60, y: 0 },
        { x: 300, y: 0 },
      ],
      40,
    );
    expect(groups.map((gr) => gr.length).sort()).toEqual([1, 3]);
  });
});

describe('proposals', () => {
  it('lost houses form a village, standing ones are left out', () => {
    const lost = [0, 1, 2, 3, 4, 5].map((i) => house(100 + i * 15, 100));
    const standing = house(400, 400);
    const mask = withBuildingAt([[402, 401]]);
    const ps = buildProposals([...lost, standing], mask, g, opts);
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ kind: 'osada', buildings: 6, lost: true });
    expect(ps[0]!.title).toBe('Zaginiona wieś (6 budynków)');
    expect(ps[0]!.e).toBeCloseTo(300_000 + 137.5 * 2, 6);
    expect(ps[0]!.n).toBeCloseTo(400_000 - 100 * 2, 6);
  });

  it('three to five lost houses are a hamlet (masculine in Polish)', () => {
    const ps = buildProposals(
      [0, 1, 2].map((i) => house(50 + i * 10, 50)),
      new Uint8Array(g.w * g.h),
      g,
      opts,
    );
    expect(ps[0]!.title).toBe('Zaginiony przysiółek (3 budynki)');
  });

  it('one or two lost houses are a farmstead (context kind "inne")', () => {
    const ps = buildProposals([house(50, 50), house(60, 52)], new Uint8Array(g.w * g.h), g, opts);
    expect(ps).toEqual([
      expect.objectContaining({
        kind: 'inne',
        buildings: 2,
        title: 'Zaginiona zagroda (2 budynki)',
      }),
    ]);
  });

  it('a mill is proposed even if a building stands there today; weak readings are dropped', () => {
    const mill: MapObject = { kind: 'mlyn', label: 'Mühle', x: 200, y: 200, confidence: 0.9 };
    const weak = house(10, 10, 0.1);
    const ps = buildProposals([mill, weak], withBuildingAt([[201, 200]]), g, opts);
    expect(ps).toEqual([
      expect.objectContaining({ kind: 'mlyn', title: 'Młyn: Mühle', lost: false }),
    ]);
  });
});

describe('reading the tool answer', () => {
  it('keeps valid objects inside the image, maps unknown kinds to "inne", clamps confidence', () => {
    const objs = parseMapObjects(
      {
        objects: [
          { kind: 'mlyn', label: 'Wassermühle', x: 10, y: 20, confidence: 1.4 },
          { kind: 'zamek', x: 5, y: 5 },
          { kind: 'budynek', x: 900, y: 5 },
          { kind: 'budynek', x: 'a', y: 5 },
        ],
      },
      500,
      500,
    );
    expect(objs).toEqual([
      { kind: 'mlyn', label: 'Wassermühle', x: 10, y: 20, confidence: 1 },
      { kind: 'inne', label: '', x: 5, y: 5, confidence: 0.5 },
    ]);
    expect(parseMapObjects(null, 10, 10)).toEqual([]);
  });
});
