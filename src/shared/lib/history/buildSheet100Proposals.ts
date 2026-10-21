import type { ProposalOptions, SiteProposal } from './buildProposals';
import { buildProposals } from './buildProposals';
import { existsToday } from './existsToday';
import type { ImageGrid, MapObject, ReadKind } from './types';

/** a village read as its middle: today's houses this close mean it still stands */
const VILLAGE_BUFFER_M = 150;
/** …and at least this many pixels, the model's middle of a village is often by its name */
const VILLAGE_BUFFER_PX = 40;

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
  const lostVillages: SiteProposal[] = objects
    .filter(
      (x) =>
        x.kind === 'wies' &&
        x.confidence >= o.minConfidence &&
        !existsToday(mask, g, x.x, x.y, Math.max(VILLAGE_BUFFER_M, g.res * VILLAGE_BUFFER_PX)),
    )
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
      objects.filter((x) => x.kind !== 'wies'),
      mask,
      g,
      { ...o, onlyLost: true },
    ),
  ];
}
