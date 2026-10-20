import type { HistoricalLayer } from '@/features/layers';
import type { KnownMap } from '@/shared/lib/history';
import type { OwnMap } from '@/shared/types/domain';
import { toViewSource } from './toViewSource';

/**
 * The maps the app knows and how older descriptions named them, to read the maps of objects
 * from before `seen` existed: online layers by name (a layer with a year to choose has the year
 * after it) and own maps by "Name (własna mapa", which matches labels with and without a year.
 */
export function knownMaps(layers: readonly HistoricalLayer[], own: readonly OwnMap[]): KnownMap[] {
  return [
    ...layers.map((layer): KnownMap =>
      layer.yearRange
        ? { ref: { kind: 'wms', id: layer.id, label: layer.label }, text: layer.label, timed: true }
        : {
            ref: toViewSource({ layer, year: 0 }).ref,
            text: layer.label,
            ...(layer.yearSpan && { years: layer.yearSpan }),
          },
    ),
    ...own.map((map): KnownMap => {
      const view = toViewSource({ own: map });
      return {
        ref: view.ref,
        text: `${map.name} (własna mapa`,
        ...(view.years && { years: view.years }),
      };
    }),
  ];
}
