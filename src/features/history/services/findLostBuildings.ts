import type { ReadProfileId } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { ContextKind, Sighting } from '@/shared/types/domain';
import type { AiModelId } from '../config/aiReading';
import { siteToProposal } from '../utils/siteToProposal';
import { viewSighting } from '../utils/viewSighting';
import type { ViewSource } from './captureView';
import type { AiUsage } from './readMapWithAi';
import { readViewSites } from './readViewSites';

export interface Proposal {
  id: string;
  kind: ContextKind;
  title: string;
  lat: number;
  lng: number;
  buildings: number;
  lost: boolean;
  /** a line object (front line, trench): its points, [lat, lng] */
  line?: [number, number][];
  /** what the context object's `source` will say */
  source: string;
  /** what the map says, without notes on the reading, e.g. "Młyn: Wassermühle" */
  label: string;
  /** the maps it was read on */
  seen: Sighting[];
}

/**
 * The view of a historical map read by Claude with the chosen profile. A topographic map is
 * compared with today's BDOT10k buildings: proposals for lost villages, farmsteads, mills,
 * inns and the like. A military map gives positions, trenches, front lines and war graves.
 */
export async function findLostBuildings(
  bounds: Bounds,
  source: ViewSource,
  model: AiModelId,
  profile: ReadProfileId,
  onStep: (step: string) => void,
): Promise<{ proposals: Proposal[]; usage: AiUsage; read: number }> {
  const { sites, usage, read } = await readViewSites(bounds, source, model, profile, onStep);
  const what = profile === 'wojskowa' ? 'auto (AI, mapa wojskowa)' : 'auto (AI)';
  return {
    proposals: sites.map((p) =>
      siteToProposal(p, `${what}: ${source.label}`, [viewSighting(source, 'ai')]),
    ),
    usage,
    read,
  };
}
