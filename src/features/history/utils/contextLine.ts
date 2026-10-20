import { pluralPl } from '@/shared/lib/format';
import { contextYears } from '@/shared/lib/history';
import type { ContextFeature } from '@/shared/types/domain';
import { describeSighting } from './describeSighting';

/**
 * An object's second line in the list: what the map says with the years and the number of maps
 * ("Młyn: Mühle · 1883–1944 · 2 mapy"); marked by hand, the map ("Messtischblatt … (1883–1942)")
 * or "2 mapy · 1883–1944"; an older object, its description.
 */
export function contextLine(f: ContextFeature): string {
  const years = contextYears(f);
  const maps = f.seen && f.seen.length > 1 ? pluralPl(f.seen.length, 'mapa', 'mapy', 'map') : null;
  if (f.label) return [f.label, years, maps].filter(Boolean).join(' · ');
  if (!f.seen?.length) return f.source;
  if (f.seen.length === 1) return describeSighting(f.seen[0]!).title;
  return [maps, years].filter(Boolean).join(' · ');
}
