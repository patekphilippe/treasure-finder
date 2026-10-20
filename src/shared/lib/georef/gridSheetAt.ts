import type { SheetBounds } from './sheetCorners';

const MIN = 1 / 60;

/**
 * The 1:100 000 sheet of the 30′ × 15′ grid that holds a point. Karte des Deutschen Reiches and
 * WIG 1:100 000 share the grid (edges at …°20′ and …°50′ east of Greenwich, every 15′ of
 * latitude), and a sheet is named after a place on it, so its title finds the sheet.
 */
export function gridSheetAt(lat: number, lng: number): SheetBounds {
  const north = Math.ceil(lat / (15 * MIN)) * 15 * MIN;
  const west = Math.floor((lng - 50 * MIN) / (30 * MIN)) * 30 * MIN + 50 * MIN;
  return { north, south: north - 15 * MIN, west, east: west + 30 * MIN };
}
