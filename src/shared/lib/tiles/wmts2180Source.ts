import type { Wmts2180Grid } from './pickSourceTiles';

/** An EPSG:2180 WMTS: its grid and how to address one tile. */
export interface Wmts2180Source extends Wmts2180Grid {
  tileUrl: (level: number, row: number, col: number) => string;
}
