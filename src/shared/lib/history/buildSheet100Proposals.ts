import type { ProposalOptions, SiteProposal } from './buildProposals';
import { buildProposals } from './buildProposals';
import { sheet100Candidates } from './sheet100Candidates';
import type { ImageGrid, MapObject, ReadKind } from './types';

/**
 * Objects read from a 1:100 000 sheet → proposals. A village counts only when today's BDOT10k has
 * no house near its middle (a lost village); a standing one is nothing to look for. Places go
 * through `buildProposals`, here only when gone: on this scale nearly every village has a manor
 * farm or church, and those standing today are no target.
 */
export function buildSheet100Proposals(
  objects: readonly MapObject<ReadKind>[],
  mask: Uint8Array,
  g: ImageGrid,
  o: ProposalOptions,
): SiteProposal[] {
  const gone = sheet100Candidates(objects, mask, g, o);
  const lostVillages: SiteProposal[] = gone
    .filter((x) => x.kind === 'wies')
    .map((x) => ({
      kind: 'osada',
      title: `Zaginiona wieś${x.label ? `: ${x.label}` : ''}`,
      e: g.originE + x.x * g.res,
      n: g.originN - x.y * g.res,
      buildings: 0,
      lost: true,
    }));
  return [
    ...lostVillages,
    ...buildProposals(
      gone.filter((x) => x.kind !== 'wies'),
      mask,
      g,
      { ...o, onlyLost: true },
    ),
  ];
}
