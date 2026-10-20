import type { HistoricalLayer } from '@/features/layers';
import type { OwnMap } from '@/shared/types/domain';
import type { ViewSource } from '../services/captureView';

/**
 * A historical map as a source to read or mark on: its label (the one place labels are made),
 * which map it is and the years it shows. An online map with a year to choose shows that year.
 */
export function toViewSource(
  from: { own: OwnMap } | { layer: HistoricalLayer; year: number },
): ViewSource {
  if ('own' in from) {
    const { own } = from;
    const label = own.year ? `${own.name} (własna mapa, ${own.year})` : `${own.name} (własna mapa)`;
    return {
      kind: 'own',
      map: own,
      label,
      ref: { kind: 'own', id: own.id, label },
      ...(own.year && { years: { from: own.year, to: own.year } }),
    };
  }
  const { layer, year } = from;
  if (layer.yearRange) {
    const label = `${layer.label} ${year}`;
    return {
      kind: 'wms',
      layer,
      year,
      label,
      ref: { kind: 'wms', id: layer.id, label, time: year },
      years: { from: year, to: year },
    };
  }
  const label = `${layer.label} (${layer.years})`;
  return {
    kind: 'wms',
    layer,
    year,
    label,
    ref: { kind: 'wms', id: layer.id, label },
    ...(layer.yearSpan && { years: layer.yearSpan }),
  };
}
