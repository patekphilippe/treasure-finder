import type { AddedCounts } from '../services/addSightedObjects';

/**
 * What adding archival objects did, e.g. "Dodano 3, dopisano mapę do 2, pominięto 1 (już są
 * z tej mapy)". With `what` for a single object: "Dodano: młyn", "Młyn: dopisano tę mapę do
 * obiektu w pobliżu".
 */
export function addedToast(c: AddedCounts, what?: string): string {
  if (what && c.added + c.merged + c.duplicates === 1) {
    const name = what.charAt(0).toUpperCase() + what.slice(1);
    if (c.merged) return `${name}: dopisano tę mapę do obiektu w pobliżu`;
    if (c.duplicates) return `${name}: obiekt z tej mapy już jest w pobliżu`;
    return `Dodano: ${what}`;
  }
  const parts = [
    c.added > 0 && `dodano ${c.added}`,
    c.merged > 0 && `dopisano mapę do ${c.merged}`,
    c.duplicates > 0 && `pominięto ${c.duplicates} (już są z tej mapy)`,
  ].filter(Boolean);
  const text = parts.join(', ') || 'nic nie dodano';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
