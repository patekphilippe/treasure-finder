import type { ExclusionGroup } from '../../config/bdotWms';
import { fetchExclusionMask } from './fetchExclusionMask';

/**
 * Non-zero where BDOT10k buildings, paved roads, railways or water (plus buffers) lie on an
 * EPSG:2180 grid. Network errors: that group is skipped and the analysis runs without it.
 */
export async function fetchBuildingMask(
  originE: number,
  originN: number,
  res: number,
  w: number,
  h: number,
  groups?: ExclusionGroup[],
): Promise<Uint8Array> {
  return (await fetchExclusionMask(originE, originN, res, w, h, groups)).mask;
}
