import type { ReadProfileId } from '@/shared/lib/history';
import type { OwnMap } from '@/shared/types/domain';
import { PROPOSAL_OPTIONS } from '../config/aiReading';
import { readResM } from './readResM';

/**
 * The profile a whole own map is read with: a topographic scan as coarse as a 1:100 000 sheet
 * gets the sheet profile (the 1:25 000 legend there drew pins on place names); a military map
 * keeps its own.
 */
export function profileForMap(map: OwnMap, chosen: ReadProfileId): ReadProfileId {
  if (chosen === 'wojskowa') return chosen;
  return readResM(map, 'topo') > PROPOSAL_OPTIONS.coarseResM ? 'arkusz100' : chosen;
}
