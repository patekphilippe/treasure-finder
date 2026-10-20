import { pluralPl } from '@/shared/lib/format';
import { contextYears } from '@/shared/lib/history';
import type { ContextFeature } from '@/shared/types/domain';

/**
 * An object's second line in the list: what the map says with the years and the number of maps
 * ("Młyn: Mühle · 1883–1944 · 2 mapy"), or the description of an older object.
 */
export function contextLine(f: ContextFeature): string {
  if (!f.label) return f.source;
  const years = contextYears(f);
  const maps = f.seen && f.seen.length > 1 ? pluralPl(f.seen.length, 'mapa', 'mapy', 'map') : null;
  return [f.label, years, maps].filter(Boolean).join(' · ');
}
