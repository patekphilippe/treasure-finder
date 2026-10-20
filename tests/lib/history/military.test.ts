import { describe, expect, it } from 'vitest';
import {
  buildMilitaryProposals,
  isReadProfileId,
  MILITARY_OBJECT_KINDS,
  parseMapObjects,
  READ_PROFILES,
} from '@/shared/lib/history';
import { contextKind } from '@/shared/lib/io/importContextGeoJSON';

const grid = { originE: 300_000, originN: 400_000, res: 5, w: 1000, h: 800 };

describe('military map reading', () => {
  it('keeps line points inside the image; one point is no line', () => {
    const objects = parseMapObjects(
      {
        objects: [
          {
            kind: 'linia_frontu',
            label: '52 A',
            x: 500,
            y: 400,
            line: [
              { x: 10, y: 20 },
              { x: 500, y: 400 },
              { x: 5000, y: 400 },
              { x: 990, y: 790 },
            ],
            confidence: 0.8,
          },
          { kind: 'okopy', label: '', x: 100, y: 100, line: [{ x: 1, y: 1 }], confidence: 0.7 },
          { kind: 'czołg', label: '', x: 50, y: 50, line: [], confidence: 0.6 },
        ],
      },
      1000,
      800,
      MILITARY_OBJECT_KINDS,
    );
    expect(objects[0]!.line).toEqual([
      { x: 10, y: 20 },
      { x: 500, y: 400 },
      { x: 990, y: 790 },
    ]);
    expect(objects[1]!.line).toBeUndefined();
    expect(objects[2]!.kind).toBe('inne');
  });

  it('the topographic default (the submissions pipeline) still knows no military kinds', () => {
    expect(parseMapObjects({ objects: [{ kind: 'okopy', x: 1, y: 1 }] }, 10, 10)[0]!.kind).toBe(
      'inne',
    );
  });

  it('positions become `wojsko`, graves `grob_wojenny` and come first; lines in EPSG:2180', () => {
    const proposals = buildMilitaryProposals(
      [
        {
          kind: 'okopy',
          label: '',
          x: 100,
          y: 200,
          confidence: 0.9,
          line: [
            { x: 0, y: 0 },
            { x: 200, y: 400 },
          ],
        },
        { kind: 'stanowisko', label: '76 mm', x: 300, y: 300, confidence: 0.2 },
        { kind: 'mogila', label: '', x: 400, y: 100, confidence: 0.6 },
      ],
      grid,
      0.35,
    );
    expect(proposals.map((p) => [p.kind, p.title])).toEqual([
      ['grob_wojenny', 'Mogiła wojenna'],
      ['wojsko', 'Okopy'],
    ]);
    expect(proposals[1]!.line).toEqual([
      [300_000, 400_000],
      [301_000, 398_000],
    ]);
    expect(proposals[1]!.lost).toBe(false);
  });

  it('profiles: the military one reads coarser views and longer answers', () => {
    expect(isReadProfileId('wojskowa')).toBe(true);
    expect(isReadProfileId('toString')).toBe(false);
    expect(READ_PROFILES.wojskowa.maxResM).toBeGreaterThan(READ_PROFILES.topo.maxResM);
    expect(READ_PROFILES.wojskowa.prompt(1000, 800, 5)).toMatch(/1 pixel = 5.0 m/);
  });

  it('a GeoJSON with "Grób wojenny" imports as a war grave', () => {
    expect(contextKind('Grób wojenny')).toBe('grob_wojenny');
    expect(contextKind('WOJSKO')).toBe('wojsko');
  });
});
