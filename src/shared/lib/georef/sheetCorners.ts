/** Map series whose sheet number gives the sheet's corners (docs/MAPY_HISTORYCZNE.md, skorowidze). */
export type SheetSeries = 'messtischblatt' | 'wig100' | 'wig25';

export interface SheetBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

const MIN = 1 / 60;

/**
 * Corners of a sheet in degrees (Greenwich) from its number. They are in the series' old datum,
 * tens of metres up to 100+ m off on WGS84: a starting point for fitting, not the result.
 * - Messtischblatt / TK25 "RRCC": 10′ × 6′, N = 56° − R·6′, W = 5°40′ + C·10′
 * - WIG 1:100 000 "P47 S40": 30′ × 15′, N = 62°15′ − P·15′, W = 4°50′ + S·30′
 * - WIG 1:25 000 "P46 S34 E": the 100k sheet split 3 × 3, letters A–I by rows from the north-west
 */
export function sheetCorners(series: SheetSeries, number: string): SheetBounds | null {
  const s = number.toUpperCase().replace(/\s+/g, ' ').trim();
  if (series === 'messtischblatt') {
    const m = /^(\d{2})(\d{2})$/.exec(s.replace(/\D/g, ''));
    if (!m) return null;
    const north = 56 - Number(m[1]) * 6 * MIN;
    const west = 5 + 40 * MIN + Number(m[2]) * 10 * MIN;
    return { north, south: north - 6 * MIN, west, east: west + 10 * MIN };
  }
  const m = /P\s*-?(\d{1,2})\D*S\s*-?(\d{1,2})(?:\D*([A-I]))?/.exec(s);
  if (!m) return null;
  const north100 = 62 + 15 * MIN - Number(m[1]) * 15 * MIN;
  const west100 = 4 + 50 * MIN + Number(m[2]) * 30 * MIN;
  if (series === 'wig100')
    return { north: north100, south: north100 - 15 * MIN, west: west100, east: west100 + 30 * MIN };
  if (!m[3]) return null;
  const k = m[3].charCodeAt(0) - 65; // A = 0 … I = 8
  const north = north100 - Math.floor(k / 3) * 5 * MIN;
  const west = west100 + (k % 3) * 10 * MIN;
  return { north, south: north - 5 * MIN, west, east: west + 10 * MIN };
}
