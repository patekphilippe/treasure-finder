import type { SheetSeries } from './sheetCorners';

/**
 * The WIG sheet in a file name, e.g. "P47_S40_BERESTECZKO_1937" (1:100 000) or "P46-S34-E"
 * (1:25 000), as `sheetCorners` takes it. A letter A–I counts only as a word of its own, so the
 * town after the number ("P47_S40_BERESTECZKO") is not read as a 1:25 000 part.
 */
export function sheetFromName(name: string): { series: SheetSeries; number: string } | null {
  const m =
    /(?<!\p{L})P(?:AS)?[\s_-]*(\d{1,2})[\s_-]*S(?:LUP|ŁUP)?[\s_-]*(\d{1,2})(?:[\s_-]+([A-I])(?!\p{L}))?/iu.exec(
      name,
    );
  if (!m) return null;
  const number = `P${Number(m[1])} S${Number(m[2])}`;
  return m[3]
    ? { series: 'wig25', number: `${number} ${m[3].toUpperCase()}` }
    : { series: 'wig100', number };
}
