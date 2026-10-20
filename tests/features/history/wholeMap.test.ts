import { describe, expect, it } from 'vitest';
import type { Proposal } from '@/features/history/services/findLostBuildings';
import { mergeChunkProposals } from '@/features/history/utils/mergeChunkProposals';
import { fromEpsg2180 } from '@/shared/lib/geo';
import { coverChunks } from '@/shared/lib/history';

let next = 0;
const at = (e: number, n: number, p: Partial<Proposal>): Proposal => {
  const [lat, lng] = fromEpsg2180(e, n);
  return {
    id: `p${next++}`,
    kind: 'inne',
    title: 'Młyn',
    label: p.title ?? 'Młyn',
    lat,
    lng,
    buildings: 0,
    lost: true,
    source: `auto (AI): Mapa, ${(p.title ?? 'Młyn').toLowerCase()}`,
    seen: [{ map: { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' }, how: 'ai' }],
    ...p,
  };
};

describe('reading a whole map window by window', () => {
  it('covers a 10 × 8 km sheet with 3.1 km windows that overlap, none outside', () => {
    const sheet = [
      [300_000, 400_000],
      [310_000, 400_000],
      [310_000, 392_000],
      [300_000, 392_000],
    ] as const;
    const chunks = coverChunks(sheet, 3100, 150);
    expect(chunks).toHaveLength(4 * 3);
    for (const c of chunks) expect(c.maxE - c.minE).toBe(3100);
    expect(Math.min(...chunks.map((c) => c.minE))).toBeLessThanOrEqual(300_000);
    expect(Math.max(...chunks.map((c) => c.maxN))).toBeGreaterThanOrEqual(400_000);
  });

  it('skips windows that miss a rotated sheet', () => {
    // a diamond: its bounding box's corners are empty
    const diamond = [
      [305_000, 410_000],
      [315_000, 400_000],
      [305_000, 390_000],
      [295_000, 400_000],
    ] as const;
    const chunks = coverChunks(diamond, 3000, 0);
    const box = Math.ceil(20_000 / 3000) ** 2;
    expect(chunks.length).toBeLessThan(box);
    expect(chunks.length).toBeGreaterThan(box / 2);
  });

  it('a village cut by a seam becomes one site; a mill read twice is kept once', () => {
    const merged = mergeChunkProposals(
      [
        at(300_000, 400_000, {
          kind: 'inne',
          title: 'Zaginiona zagroda (2 budynki)',
          buildings: 2,
        }),
        at(300_060, 400_000, {
          kind: 'osada',
          title: 'Zaginiony przysiółek (4 budynki)',
          buildings: 4,
        }),
        at(301_000, 400_000, { title: 'Młyn' }),
        at(301_020, 400_000, { title: 'Młyn' }),
        at(302_000, 400_000, { title: 'Młyn' }),
      ],
      80,
      40,
    );
    expect(merged.map((p) => p.title)).toEqual(['Młyn', 'Młyn', 'Zaginiona wieś (6 budynków)']);
    const village = merged[2]!;
    expect(village.kind).toBe('osada');
    expect(village.source).toBe('auto (AI): Mapa, zaginiona wieś (6 budynków)');
    expect(village.label).toBe('Zaginiona wieś (6 budynków)');
  });
});
