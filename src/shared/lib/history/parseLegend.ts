/** entries kept: a legend's relevant part is a few dozen */
const MAX_ENTRIES = 60;
const MAX_TEXT = 80;

/** The legend reading's JSON → lines "sign: meaning" (anything malformed is dropped). */
export function parseLegend(input: unknown): string[] {
  const list = (input as { entries?: unknown })?.entries;
  if (!Array.isArray(list)) return [];
  const clean = (v: unknown) =>
    typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT) : '';
  return list
    .map((e: Record<string, unknown> | null) => [clean(e?.sign), clean(e?.meaning)] as const)
    .filter(([sign, meaning]) => sign && meaning)
    .map(([sign, meaning]) => `${sign}: ${meaning}`)
    .slice(0, MAX_ENTRIES);
}
