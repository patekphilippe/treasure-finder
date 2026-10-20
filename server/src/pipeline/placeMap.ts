import { sheetCorners, type SheetSeries } from '@/shared/lib/georef/sheetCorners';
import type { ViewBbox } from '@/shared/types/sources';
import type { Env } from '../env';
import { findPlaces, growBbox, nameVariants, uniquePlace, type Place } from './gazetteer';
import { placeByNames, placeBySheet, type Placement } from './georef';
import type { MapReading } from './readings';

const SHEET_SERIES: Record<string, SheetSeries> = {
  messtischblatt: 'messtischblatt',
  wig25: 'wig25',
  wig100: 'wig100',
};

/** most names looked up per map: each lookup waits a second (Nominatim policy) */
const NAMES_PER_MAP = 20;

/** Where the map is: sheet number and frame first, then place names near the sender's view. */
export async function placeMap(
  env: Env,
  reading: MapReading,
  view: ViewBbox | null,
  now: number,
): Promise<Placement | null> {
  const series = SHEET_SERIES[reading.series];
  if (series && reading.sheetNumber && reading.frameCorners) {
    const bySheet = placeBySheet(series, reading.sheetNumber, reading.frameCorners);
    if (bySheet) return bySheet;
  }
  const sheet = series && reading.sheetNumber ? sheetCorners(series, reading.sheetNumber) : null;
  const area = sheet ? growBbox(sheet, 5) : view ? growBbox(view, 15) : null;
  if (!area) return null;
  const pairs: { uv: { x: number; y: number }; at: Place }[] = [];
  for (const name of reading.placeNames.slice(0, NAMES_PER_MAP)) {
    for (const spelling of nameVariants(name.text)) {
      const found = await findPlaces(env.DB, spelling, area, now);
      if (!found.length) continue;
      // a name that fits several places is no anchor
      const place = uniquePlace(found);
      if (place) pairs.push({ uv: name, at: place });
      break;
    }
  }
  return placeByNames(pairs);
}
