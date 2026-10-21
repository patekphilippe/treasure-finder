import { POI_KINDS, READ_ERROR_PX, type ProposalOptions } from './buildProposals';
import { existsToday } from './existsToday';
import type { ImageGrid, MapObject, ReadKind } from './types';

/** a village read as its middle: today's houses this close mean it still stands */
const VILLAGE_BUFFER_M = 150;
/** …and at least this many pixels, the model's middle of a village is often by its name */
const VILLAGE_BUFFER_PX = 40;

/**
 * What a 1:100 000 reading may propose, before the second look: sure enough, and gone today (a
 * village with no house near its middle, a place with no building within the reading error).
 */
export function sheet100Candidates(
  objects: readonly MapObject<ReadKind>[],
  mask: Uint8Array,
  g: ImageGrid,
  o: ProposalOptions,
): MapObject<ReadKind>[] {
  const village = Math.max(VILLAGE_BUFFER_M, g.res * VILLAGE_BUFFER_PX);
  const place = Math.max(o.bufferM, g.res * READ_ERROR_PX);
  return objects.filter(
    (x) =>
      x.confidence >= o.minConfidence &&
      (x.kind === 'wies'
        ? !existsToday(mask, g, x.x, x.y, village)
        : POI_KINDS.has(x.kind) && !existsToday(mask, g, x.x, x.y, place)),
  );
}
