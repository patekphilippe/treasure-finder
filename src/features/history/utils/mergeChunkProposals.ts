import { fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import { siteTitle } from '@/shared/lib/history';
import type { Proposal } from '../services/findLostBuildings';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Proposals from neighbouring windows of one map → one list. Groups of lost buildings closer
 * than `linkM` join into one site (counts add up, centre weighted), so a village on a seam is
 * not two farmsteads; the same named place read in two windows (same title, closer than
 * `dupM`) is kept once. Lines are kept as they are.
 */
export function mergeChunkProposals(list: Proposal[], linkM: number, dupM: number): Proposal[] {
  const at = list.map((p) => toEpsg2180(p.lat, p.lng));
  const dist = (i: number, j: number) => Math.hypot(at[i]![0] - at[j]![0], at[i]![1] - at[j]![1]);

  const sites = list.flatMap((p, i) => (p.buildings > 0 ? [i] : []));
  const parent = new Map(sites.map((i) => [i, i]));
  const root = (i: number): number => (parent.get(i) === i ? i : root(parent.get(i)!));
  for (const i of sites)
    for (const j of sites) if (i < j && dist(i, j) <= linkM) parent.set(root(j), root(i));
  const groups = new Map<number, number[]>();
  for (const i of sites) groups.set(root(i), [...(groups.get(root(i)) ?? []), i]);
  const merged: Proposal[] = [...groups.values()].map((idx) => {
    const first = list[idx[0]!]!;
    if (idx.length === 1) return first;
    const n = idx.reduce((s, i) => s + list[i]!.buildings, 0);
    const e = idx.reduce((s, i) => s + at[i]![0] * list[i]!.buildings, 0) / n;
    const north = idx.reduce((s, i) => s + at[i]![1] * list[i]!.buildings, 0) / n;
    const [lat, lng] = fromEpsg2180(e, north);
    const title = siteTitle(n);
    return {
      ...first,
      kind: n >= 3 ? 'osada' : 'inne',
      title,
      lat,
      lng,
      buildings: n,
      source: first.source.replace(lowerFirst(first.title), lowerFirst(title)),
    };
  });

  const kept: number[] = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i]!;
    if (p.buildings > 0) continue;
    const twin = !p.line && kept.some((k) => list[k]!.title === p.title && dist(k, i) <= dupM);
    if (!twin) kept.push(i);
  }
  return [...kept.map((i) => list[i]!), ...merged.sort((a, b) => b.buildings - a.buildings)];
}
