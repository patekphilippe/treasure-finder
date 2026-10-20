import type { SiteProposal } from './buildProposals';

export type SeenOn = 'both' | 'a' | 'b';

/** what counts as the same place: a lost site matches a lost site, a mill a mill */
const group = (p: SiteProposal) =>
  p.buildings > 0 ? 'site' : `${p.kind}:${p.title.split(':')[0]}`;

/**
 * Proposals read from the same view of two maps, paired: the same kind of place within
 * `linkM` on both maps is one proposal (seen on both: more certain, the middle of the two
 * positions, the larger site); the rest are marked as seen on one map only. Both on the same
 * EPSG:2180 metres.
 */
export function compareSites(
  a: readonly SiteProposal[],
  b: readonly SiteProposal[],
  linkM: number,
): { site: SiteProposal; seen: SeenOn }[] {
  const used = new Set<number>();
  const out: { site: SiteProposal; seen: SeenOn }[] = [];
  for (const p of a) {
    let best = -1;
    let bestD = linkM;
    b.forEach((q, j) => {
      if (used.has(j) || group(q) !== group(p)) return;
      const d = Math.hypot(q.e - p.e, q.n - p.n);
      if (d <= bestD) {
        bestD = d;
        best = j;
      }
    });
    if (best < 0) {
      out.push({ site: p, seen: 'a' });
      continue;
    }
    used.add(best);
    const q = b[best]!;
    const bigger = q.buildings > p.buildings ? q : p;
    out.push({
      site: { ...bigger, e: (p.e + q.e) / 2, n: (p.n + q.n) / 2, lost: p.lost && q.lost },
      seen: 'both',
    });
  }
  b.forEach((q, j) => {
    if (!used.has(j)) out.push({ site: q, seen: 'b' });
  });
  // what both maps show first: the surest
  return out.sort((x, y) => Number(y.seen === 'both') - Number(x.seen === 'both'));
}
