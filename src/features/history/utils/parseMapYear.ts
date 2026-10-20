/** The year typed for a map: a number 1500–2100, undefined when cleared, null when not a year. */
export function parseMapYear(text: string): number | undefined | null {
  const t = text.trim();
  if (t === '') return undefined;
  if (!/^\d{4}$/.test(t)) return null;
  const year = Number(t);
  return year >= 1500 && year <= 2100 ? year : null;
}
