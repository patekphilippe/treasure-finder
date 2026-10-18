/** Elevation grid in EPSG:2180. NODATA cells are NaN. Row 0 is the northern edge. */
export interface DemGrid {
  w: number;
  h: number;
  /** cell size in metres */
  cell: number;
  /** EPSG:2180 of the top-left corner of the top-left cell */
  originE: number;
  originN: number;
  dem: Float32Array;
}

/** Centre of a cell in EPSG:2180 metres. */
export function cellCenter(
  g: Pick<DemGrid, 'cell' | 'originE' | 'originN'>,
  row: number,
  col: number,
) {
  return { e: g.originE + (col + 0.5) * g.cell, n: g.originN - (row + 0.5) * g.cell };
}
