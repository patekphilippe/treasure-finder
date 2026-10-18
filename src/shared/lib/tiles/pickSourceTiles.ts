import { chooseLevel } from './chooseLevel';
import { sourceTileRange, type TileRange } from './sourceTileRange';
import type { XY } from './tileAffine';

export interface Wmts2180Grid {
  tileSize: number;
  originEasting: number;
  originNorthing: number;
  resolutions: readonly number[];
  matrixSize: readonly (readonly [number, number])[];
}

/** At low zooms one map tile spans many source tiles — step to coarser levels beyond this. */
const MAX_SOURCE_TILES = 12;

/**
 * The EPSG:2180 WMTS level and tiles one map tile needs, from its corners in metres
 * (top-left, top-right, bottom-left, bottom-right). Shared by the map layer and the offline
 * download, so a downloaded area holds exactly the tiles the map will ask for.
 */
export function pickSourceTiles(
  corners: readonly [XY, XY, XY, XY],
  tilePx: number,
  dpr: number,
  grid: Wmts2180Grid,
): { level: number; range: TileRange } | null {
  const [p0, p1, p2, p3] = corners;
  const bbox = {
    minE: Math.min(p0.x, p1.x, p2.x, p3.x),
    maxE: Math.max(p0.x, p1.x, p2.x, p3.x),
    minN: Math.min(p0.y, p1.y, p2.y, p3.y),
    maxN: Math.max(p0.y, p1.y, p2.y, p3.y),
  };
  let level = chooseLevel(Math.hypot(p1.x - p0.x, p1.y - p0.y) / (tilePx * dpr), grid.resolutions);
  for (; level >= 0; level--) {
    const span = grid.tileSize * grid.resolutions[level]!;
    const range = sourceTileRange(
      bbox,
      grid.originEasting,
      grid.originNorthing,
      span,
      grid.matrixSize[level]!,
    );
    if (!range) return null;
    if ((range.col1 - range.col0 + 1) * (range.row1 - range.row0 + 1) <= MAX_SOURCE_TILES)
      return { level, range };
  }
  return null;
}
