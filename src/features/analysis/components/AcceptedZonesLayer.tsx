import { GeoJSON } from 'react-leaflet';
import { useLayersStore } from '@/features/layers';
import { PRIORITY_COLOR } from '../config/interpretationStyle';
import { useAnalysisStore } from '../store/useAnalysisStore';

/** In the field: search zones of accepted candidates, coloured by priority (red outline for UXO). */
export function AcceptedZonesLayer() {
  const on = useLayersStore((s) => s.searchZonesOn);
  const candidates = useAnalysisStore((s) => s.candidates);
  if (!on) return null;
  return candidates
    .filter((c) => c.decision === 'przyjety' && c.searchZone)
    .map((c) => (
      <GeoJSON
        key={c.id}
        data={c.searchZone!}
        interactive={false}
        style={{
          color: c.flags.uxo ? '#dc2626' : PRIORITY_COLOR[c.priority],
          weight: 2,
          dashArray: c.flags.uxo ? '6 4' : undefined,
          fillColor: PRIORITY_COLOR[c.priority],
          fillOpacity: 0.15,
        }}
      />
    ));
}
