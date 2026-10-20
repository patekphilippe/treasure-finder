import { BDOT_EXCLUSION } from '@/shared/config/bdotWms';
import { createId } from '@/shared/lib/createId';
import { fromEpsg2180 } from '@/shared/lib/geo';
import { buildProposals } from '@/shared/lib/history';
import { fetchBuildingMask } from '@/shared/lib/tiles';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { ContextKind } from '@/shared/types/domain';
import { PROPOSAL_OPTIONS, type AiModelId } from '../config/aiReading';
import { captureView, type ViewSource } from './captureView';
import { readMapWithAi, type AiUsage } from './readMapWithAi';

export interface Proposal {
  id: string;
  kind: ContextKind;
  title: string;
  lat: number;
  lng: number;
  buildings: number;
  lost: boolean;
  /** what the context object's `source` will say */
  source: string;
}

/**
 * The view of a historical map read by Claude, compared with today's BDOT10k buildings:
 * proposals for lost villages, farmsteads, mills, inns and the like.
 */
export async function findLostBuildings(
  bounds: Bounds,
  source: ViewSource,
  model: AiModelId,
  turnstileToken: string | null,
  onStep: (step: string) => void,
): Promise<{ proposals: Proposal[]; usage: AiUsage; read: number }> {
  onStep('Przygotowuję obraz mapy');
  const { image, grid } = await captureView(bounds, source);
  onStep('Claude czyta mapę');
  const { objects, usage } = await readMapWithAi(
    image,
    grid.w,
    grid.h,
    grid.res,
    model,
    turnstileToken,
  );
  onStep('Porównuję z dzisiejszymi budynkami (BDOT10k)');
  const buildings = await fetchBuildingMask(grid.originE, grid.originN, grid.res, grid.w, grid.h, [
    { ...BDOT_EXCLUSION[0]!, bufferM: 0 },
  ]);
  const proposals = buildProposals(objects, buildings, grid, PROPOSAL_OPTIONS).map((p) => {
    const [lat, lng] = fromEpsg2180(p.e, p.n);
    return {
      id: createId(),
      kind: p.kind,
      title: p.title,
      lat,
      lng,
      buildings: p.buildings,
      lost: p.lost,
      source: `auto (AI): ${source.label}, ${p.title.charAt(0).toLowerCase()}${p.title.slice(1)}`,
    };
  });
  return { proposals, usage, read: objects.length };
}
