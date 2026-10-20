import { describe, expect, it } from 'vitest';
import { compareSites, type SiteProposal } from '@/shared/lib/history';

const site = (e: number, n: number, p: Partial<SiteProposal> = {}): SiteProposal => ({
  kind: 'mlyn',
  title: 'Młyn: Mühle',
  e,
  n,
  buildings: 0,
  lost: true,
  ...p,
});

describe('comparing the same view on two maps', () => {
  it('the same place on both maps is one surer proposal, the rest says which map shows it', () => {
    const older = [
      site(1000, 1000),
      site(2000, 2000, { kind: 'osada', title: 'Zaginiona wieś (8 budynków)', buildings: 8 }),
      site(5000, 5000, { kind: 'karczma', title: 'Karczma: Kretscham' }),
    ];
    const newer = [
      // the mill drawn 40 m off, named differently
      site(1030, 1025, { title: 'Młyn: Wassermühle' }),
      site(2050, 2000, { kind: 'osada', title: 'Zaginiony przysiółek (4 budynki)', buildings: 4 }),
      site(9000, 9000, { kind: 'inne', title: 'Cegielnia', lost: false }),
    ];
    const r = compareSites(older, newer, 80);
    expect(r.map((x) => [x.site.title, x.seen])).toEqual([
      ['Młyn: Mühle', 'both'],
      ['Zaginiona wieś (8 budynków)', 'both'],
      ['Karczma: Kretscham', 'a'],
      ['Cegielnia', 'b'],
    ]);
    expect(r[0]!.site.e).toBe(1015);
  });

  it('different kinds or too far apart do not pair', () => {
    const r = compareSites(
      [site(0, 0)],
      [site(0, 10, { kind: 'karczma', title: 'Karczma' }), site(500, 0)],
      80,
    );
    expect(r.map((x) => x.seen)).toEqual(['a', 'b', 'b']);
  });
});
