import { gridSheetAt } from '@/shared/lib/georef/gridSheetAt';
import { sheetCorners, type SheetBounds, type SheetSeries } from '@/shared/lib/georef/sheetCorners';
import type { ViewBbox } from '@/shared/types/sources';
import type { Env } from '../env';
import { findPlaces, growBbox, nameVariants, uniquePlace, type Place } from './gazetteer';
import { placeByBounds, placeByNames, placeBySheet, type Placement } from './georef';
import type { MapReading } from './readings';

const SHEET_SERIES: Record<string, SheetSeries> = {
  messtischblatt: 'messtischblatt',
  wig25: 'wig25',
  wig100: 'wig100',
};

/** most names looked up per map: each lookup waits a second (Nominatim policy) */
const NAMES_PER_MAP = 20;

/** series on the 1:100 000 grid of 30′ × 15′, where a sheet is found by the town it is named after */
const GRID_100K: readonly string[] = ['kdr', 'wig100'];
/** where a sheet title is looked up: Poland and the former German east */
const TITLE_AREA: ViewBbox = { south: 48.9, north: 56, west: 13, east: 24.2 };

/** The 1:100 000 sheet a title names (the Karte des Deutschen Reiches numbers are no grid). */
async function sheetByTitle(env: Env, title: string, now: number): Promise<SheetBounds | null> {
  for (const spelling of nameVariants(title)) {
    const found = await findPlaces(env.DB, spelling, TITLE_AREA, now);
    // a town before the commune around it; with several, the most important one Nominatim gives
    const place = uniquePlace(found) ?? found.find((p) => !p.boundary) ?? found[0];
    if (place) return gridSheetAt(place.lat, place.lng);
  }
  return null;
}

/**
 * Where the map is: sheet number and frame first, then a 1:100 000 sheet by its title, then place
 * names near the sheet or the sender's view.
 */
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
  const numbered = series && reading.sheetNumber ? sheetCorners(series, reading.sheetNumber) : null;
  const titled =
    !numbered && GRID_100K.includes(reading.series) && reading.sheetTitle
      ? await sheetByTitle(env, reading.sheetTitle, now)
      : null;
  if (titled && reading.frameCorners) return placeByBounds(titled, reading.frameCorners);
  const sheet = numbered ?? titled;
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
