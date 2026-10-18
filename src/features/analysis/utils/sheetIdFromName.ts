/** Godło from Geoportal file names like 4102_77565_M-33-33-B-d-3-1.asc, else the file name. */
export function sheetIdFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return base.match(/[MN]-\d{2}-\d{1,3}(-[A-Da-d0-9]+)*$/)?.[0] ?? base;
}
