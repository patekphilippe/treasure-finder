import { crsTransform, fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import { applyHomography, gridSheetAt } from '@/shared/lib/georef';
import { coverChunks, type ReadProfileId } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import { AI_MAX_SIDE } from '../config/aiReading';
import { readResM } from './readResM';

/** a window a little under the profile's widest view: its WGS84 box grows slightly in EPSG:2180 */
const SIZE_MARGIN = 0.9;
/** neighbouring windows overlap, so an object on the seam is seen whole in one of them */
const MIN_OVERLAP_M = 150;

/**
 * A 1:100 000 sheet read only inside its frame: the 30′ × 15′ cell under the scan's middle. Its
 * margin holds the legend, sheet numbers and neighbours' names, which a reading took for places
 * beyond the frame.
 */
function sheetCellOf(footprint: [number, number][]) {
  const es = footprint.map((p) => p[0]);
  const ns = footprint.map((p) => p[1]);
  const [lat, lng] = fromEpsg2180(
    (Math.min(...es) + Math.max(...es)) / 2,
    (Math.min(...ns) + Math.max(...ns)) / 2,
  );
  return gridSheetAt(lat, lng);
}

/** a scan the size of one sheet with its margins (not an overview map at the same coarseness) */
function isOneSheet(footprint: [number, number][]): boolean {
  const cell = sheetCellOf(footprint);
  const frame = [toEpsg2180(cell.north, cell.west), toEpsg2180(cell.south, cell.east)];
  const span = (v: number[]) => Math.max(...v) - Math.min(...v);
  const w = span(footprint.map((p) => p[0])) / Math.abs(frame[1]![0] - frame[0]![0]);
  const h = span(footprint.map((p) => p[1])) / Math.abs(frame[0]![1] - frame[1]![1]);
  return w > 0.8 && w < 1.6 && h > 0.8 && h < 1.6;
}

function withinSheetFrame(footprint: [number, number][]): [number, number][] {
  const es = footprint.map((p) => p[0]);
  const ns = footprint.map((p) => p[1]);
  const cell = sheetCellOf(footprint);
  const frame = [
    toEpsg2180(cell.north, cell.west),
    toEpsg2180(cell.north, cell.east),
    toEpsg2180(cell.south, cell.east),
    toEpsg2180(cell.south, cell.west),
  ];
  const minE = Math.max(Math.min(...es), Math.min(...frame.map((p) => p[0])));
  const maxE = Math.min(Math.max(...es), Math.max(...frame.map((p) => p[0])));
  const minN = Math.max(Math.min(...ns), Math.min(...frame.map((p) => p[1])));
  const maxN = Math.min(Math.max(...ns), Math.max(...frame.map((p) => p[1])));
  // a scan that is not one whole sheet (cut, or between cells): read as it is
  if (minE >= maxE || minN >= maxN) return footprint;
  return [
    [minE, maxN],
    [maxE, maxN],
    [maxE, minN],
    [minE, minN],
  ];
}

/**
 * The views that read a whole own map with a profile: windows over the map's footprint,
 * as map bounds. Null when the map's coordinate system is unknown.
 */
export function wholeMapChunks(map: OwnMap, profile: ReadProfileId): Bounds[] | null {
  const crs = crsTransform(map.epsg);
  if (!crs) return null;
  const footprint = [
    [0, 0],
    [map.width, 0],
    [map.width, map.height],
    [0, map.height],
  ].map(([x, y]) => {
    const p = applyHomography(map.pixelToSource, { x: x!, y: y! });
    return crs.to2180(p.x, p.y);
  });
  const sizeM = readResM(map, profile) * AI_MAX_SIDE * SIZE_MARGIN;
  const sheet = profile === 'arkusz100' && isOneSheet(footprint);
  const windows = coverChunks(
    sheet ? withinSheetFrame(footprint) : footprint,
    sizeM,
    Math.max(MIN_OVERLAP_M, sizeM * 0.05),
  ).map((c) => {
    const corners = [
      fromEpsg2180(c.minE, c.maxN),
      fromEpsg2180(c.maxE, c.maxN),
      fromEpsg2180(c.minE, c.minN),
      fromEpsg2180(c.maxE, c.minN),
    ];
    // the inner box: its EPSG:2180 box stays within the window's size
    return {
      north: Math.min(corners[0]![0], corners[1]![0]),
      south: Math.max(corners[2]![0], corners[3]![0]),
      west: Math.max(corners[0]![1], corners[2]![1]),
      east: Math.min(corners[1]![1], corners[3]![1]),
    };
  });
  if (!sheet) return windows;
  // the windows have one size and stick out past the frame: cut to it, or the margin is read
  const cell = sheetCellOf(footprint);
  return windows
    .map((b) => ({
      north: Math.min(b.north, cell.north),
      south: Math.max(b.south, cell.south),
      west: Math.max(b.west, cell.west),
      east: Math.min(b.east, cell.east),
    }))
    .filter((b) => b.north > b.south && b.east > b.west);
}
