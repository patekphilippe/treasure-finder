import { BDOT_EXCLUSION } from '@/shared/config/bdotWms';
import {
  buildMilitaryProposals,
  buildProposals,
  READ_PROFILES,
  type ReadProfileId,
  type SiteProposal,
} from '@/shared/lib/history';
import { fetchBuildingMask } from '@/shared/lib/tiles';
import type { Bounds } from '@/shared/store/useMapViewStore';
import { PROPOSAL_OPTIONS, type AiModelId } from '../config/aiReading';
import { captureView, type ViewSource } from './captureView';
import { readMapWithAi, type AiUsage } from './readMapWithAi';

/**
 * One view of a map read by Claude with a profile, as proposals in EPSG:2180: a topographic
 * map compared with today's BDOT10k buildings, a military map as positions and graves.
 */
export async function readViewSites(
  bounds: Bounds,
  source: ViewSource,
  model: AiModelId,
  profile: ReadProfileId,
  onStep: (step: string) => void,
): Promise<{ sites: SiteProposal[]; usage: AiUsage; read: number }> {
  onStep('Przygotowuję obraz mapy');
  const { image, grid } = await captureView(bounds, source, READ_PROFILES[profile].maxResM);
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
  return {
    sites: buildProposals(objects, buildings, grid, PROPOSAL_OPTIONS),
    usage,
    read: objects.length,
  };
}
