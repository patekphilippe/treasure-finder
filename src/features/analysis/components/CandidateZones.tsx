import L from 'leaflet';
import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Candidate } from '@/shared/types/domain';
import { PRIORITY_COLOR } from '../config/interpretationStyle';
import { useAnalysisStore } from '../store/useAnalysisStore';

interface CandidateZonesProps {
  candidates: readonly Candidate[];
  /** draw zones for at most this many (best first) */
  limit?: number;
}

/** Outline of the form and its translucent search zone, coloured by priority. */
export function CandidateZones({ candidates, limit = 400 }: CandidateZonesProps) {
  const selectedId = useAnalysisStore((s) => s.selectedId);
  const renderer = useMemo(() => L.canvas({ padding: 0.5 }), []);
  const shown = candidates.slice(0, limit);

  return shown.flatMap((c) => {
    const color = PRIORITY_COLOR[c.priority];
    const selected = c.id === selectedId;
    const layers = [];
    if (c.searchZone)
      layers.push(
        <GeoJSON
          key={`z-${c.id}-${selected}`}
          data={c.searchZone}
          interactive={false}
          style={{
            renderer,
            color,
            weight: selected ? 2 : 1,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: selected ? 0.25 : 0.12,
            dashArray: '4 4',
          }}
        />,
      );
    if (c.priority === 'chroniony' && c.exclusionZone)
      layers.push(
        <GeoJSON
          key={`x-${c.id}`}
          data={c.exclusionZone}
          interactive={false}
          style={{ renderer, color, weight: 1, fillColor: color, fillOpacity: 0.15 }}
        />,
      );
    if (c.outline)
      layers.push(
        <GeoJSON
          key={`o-${c.id}-${selected}`}
          data={c.outline}
          interactive={false}
          style={{ renderer, color, weight: selected ? 3 : 1.5, fillOpacity: 0 }}
        />,
      );
    return layers;
  });
}
