/**
 * A map name as people read it: file names like "P44_S24_(424)_BRESLAU_1933" get spaces, so
 * they wrap on a phone instead of running off the sheet.
 */
export function readableMapName(name: string): string {
  return name
    .replace(/_+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
