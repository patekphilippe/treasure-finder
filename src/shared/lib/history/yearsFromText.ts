import type { YearSpan } from '@/shared/types/domain';

const YEAR = '(1[5-9]\\d\\d|20\\d\\d)';
const RANGE = new RegExp(`(?<!\\d)${YEAR}\\s*[–-]\\s*${YEAR}(?!\\d)`);
const SINGLE = new RegExp(`(?<![\\d.,])${YEAR}(?![\\d.,]\\d)(?!\\d)`, 'g');
/** "od 1995": since then, not the year shown */
const SINCE = /\bod \d{4}\b/g;
const FILE = /\.(geo)?json$/i;

/**
 * Years written in an older description, e.g. "Messtischblatt … (1883–1942)" or
 * "Ortofotomapa archiwalna 2004": a range first, else the last single year. Null for a file
 * name and for numbers outside 1500–2100.
 */
export function yearsFromText(text: string): YearSpan | null {
  if (FILE.test(text.trim())) return null;
  const clean = text.replace(SINCE, '');
  const range = RANGE.exec(clean);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    if (from <= to && to <= 2100) return { from, to };
  }
  const singles = [...clean.matchAll(SINGLE)].map((m) => Number(m[1])).filter((y) => y <= 2100);
  const last = singles.at(-1);
  return last === undefined ? null : { from: last, to: last };
}
