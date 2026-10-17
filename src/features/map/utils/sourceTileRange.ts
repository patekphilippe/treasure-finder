export interface TileRange {
  col0: number;
  col1: number;
  row0: number;
  row1: number;
}

/** WMTS tiles (cols from the west, rows from the north) covering a projected bbox, clamped to the matrix. */
export function sourceTileRange(
  bbox: { minE: number; maxE: number; minN: number; maxN: number },
  originE: number,
  originN: number,
  spanM: number,
  matrix: readonly [number, number],
): TileRange | null {
  const col0 = Math.max(0, Math.floor((bbox.minE - originE) / spanM));
  const col1 = Math.min(matrix[0] - 1, Math.floor((bbox.maxE - originE) / spanM));
  const row0 = Math.max(0, Math.floor((originN - bbox.maxN) / spanM));
  const row1 = Math.min(matrix[1] - 1, Math.floor((originN - bbox.minN) / spanM));
  return col0 > col1 || row0 > row1 ? null : { col0, col1, row0, row1 };
}
