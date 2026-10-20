import { compareSites } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import { PROPOSAL_OPTIONS, type AiModelId } from '../config/aiReading';
import { siteToProposal } from '../utils/siteToProposal';
import { viewSighting } from '../utils/viewSighting';
import type { ViewSource } from './captureView';
import type { Proposal } from './findLostBuildings';
import type { AiUsage } from './readMapWithAi';
import { readViewSites } from './readViewSites';

/** a place read on two maps drawn decades apart may be shifted a little more than on one */
const SAME_PLACE_M = PROPOSAL_OPTIONS.linkM;

/**
 * The same view read on two topographic maps (members only: two readings), paired: what both
 * maps show is surer, what only one shows appeared or disappeared between them. Titles say which.
 */
export async function compareMaps(
  bounds: Bounds,
  a: ViewSource,
  b: ViewSource,
  model: AiModelId,
  onStep: (step: string) => void,
): Promise<{ proposals: Proposal[]; usage: AiUsage; read: number }> {
  const first = await readViewSites(bounds, a, model, 'topo', null, (s) =>
    onStep(`${a.label}: ${s}`),
  );
  const second = await readViewSites(bounds, b, model, 'topo', null, (s) =>
    onStep(`${b.label}: ${s}`),
  );
  const origin = `auto (AI, porównanie): ${a.label} i ${b.label}`;
  const onA = viewSighting(a, 'ai');
  const onB = viewSighting(b, 'ai');
  const proposals = compareSites(first.sites, second.sites, SAME_PLACE_M).map(({ site, seen }) => ({
    ...siteToProposal(
      {
        ...site,
        title: `${site.title} (${seen === 'both' ? 'na obu mapach' : `tylko: ${(seen === 'a' ? a : b).label}`})`,
      },
      origin,
      seen === 'both' ? [onA, onB] : seen === 'a' ? [onA] : [onB],
    ),
    label: site.title,
  }));
  return {
    proposals,
    usage: {
      inputTokens: first.usage.inputTokens + second.usage.inputTokens,
      outputTokens: first.usage.outputTokens + second.usage.outputTokens,
    },
    read: first.read + second.read,
  };
}
