import { BDOT_EXCLUSION } from '@/shared/config/bdotWms';
import {
  buildMilitaryProposals,
  buildProposals,
  buildSheet100Proposals,
  READ_PROFILES,
  sheet100Candidates,
  type ReadProfileId,
  type SiteProposal,
} from '@/shared/lib/history';
import { fetchBuildingMask } from '@/shared/lib/tiles';
import type { Bounds } from '@/shared/store/useMapViewStore';
import { PROPOSAL_OPTIONS, type AiModelId } from '../config/aiReading';
import { captureView, type ViewSource } from './captureView';
import { checkSheet100 } from './checkSheet100';
import { readMapWithAi, type AiUsage } from './readMapWithAi';

/**
 * One view of a map read by Claude with a profile, as proposals in EPSG:2180: a topographic
 * map compared with today's BDOT10k buildings, a 1:100 000 sheet also checked spot by spot on an
 * enlarged close-up (checkSheet100), a military map as positions and graves.
 */
export async function readViewSites(
  bounds: Bounds,
  source: ViewSource,
  model: AiModelId,
  profile: ReadProfileId,
  onStep: (step: string) => void,
  /** metres per pixel; a coarse scan is read at its own resolution (utils/readResM) */
  resM = READ_PROFILES[profile].maxResM,
): Promise<{ sites: SiteProposal[]; usage: AiUsage; read: number }> {
  onStep('Przygotowuję obraz mapy');
  const { image, grid } = await captureView(bounds, source, resM);
  onStep('Claude czyta mapę');
  const { objects, usage } = await readMapWithAi(image, grid.w, grid.h, grid.res, model, profile);
  if (profile === 'wojskowa')
    return {
      sites: buildMilitaryProposals(objects, grid, PROPOSAL_OPTIONS.minConfidence),
      usage,
      read: objects.length,
    };
  onStep('Porównuję z dzisiejszymi budynkami (BDOT10k)');
  const buildings = await fetchBuildingMask(grid.originE, grid.originN, grid.res, grid.w, grid.h, [
    { ...BDOT_EXCLUSION[0]!, bufferM: 0 },
  ]);
  if (profile === 'arkusz100') {
    // a second, enlarged look at each spot left: a village name read as a place is not confirmed
    onStep('Sprawdzam miejsca z bliska');
    const spots = sheet100Candidates(objects, buildings, grid, PROPOSAL_OPTIONS);
    const checked = await checkSheet100(image, grid, spots, model);
    return {
      sites: buildSheet100Proposals(checked.confirmed, buildings, grid, PROPOSAL_OPTIONS),
      usage: {
        inputTokens: usage.inputTokens + checked.usage.inputTokens,
        outputTokens: usage.outputTokens + checked.usage.outputTokens,
      },
      read: objects.length,
    };
  }
  return {
    sites: buildProposals(objects, buildings, grid, PROPOSAL_OPTIONS),
    usage,
    read: objects.length,
  };
}
