import { pluralPl } from '@/shared/lib/format';
import type { OldMapGroup } from './oldMapGroups';
import { readableMapName } from './readableMapName';

/** The tile of a year of your maps: "Twoja mapa z 1934 r." and the names under it. */
export function oldMapGroupText(g: OldMapGroup): { title: string; subtitle: string } {
  const n = g.maps.length;
  const when = g.year ? `z ${g.year} r.` : 'bez roku';
  const names = g.maps.slice(0, 2).map((m) => readableMapName(m.name));
  const rest = n - names.length;
  return {
    title: n === 1 ? `Twoja mapa ${when}` : `Twoje mapy ${when} (${n})`,
    subtitle: names.join(', ') + (rest > 0 ? ` i ${pluralPl(rest, 'inna', 'inne', 'innych')}` : ''),
  };
}
