import { Circle, CircleMarker, Tooltip } from 'react-leaflet';
import { useSourcesStore } from '../store/useSourcesStore';

/** Objects of the analysis chosen in "Moje analizy": point and the circle it may be off by. */
export function SourceProposalsLayer() {
  const shown = useSourcesStore((s) => s.sent.find((x) => x.id === s.shownId));
  const objects = shown?.view?.result?.objects ?? [];

  return objects.map((o, i) => (
    <Circle
      key={i}
      center={[o.lat, o.lng]}
      radius={o.radiusM}
      pathOptions={{ color: '#7c3aed', weight: 2, dashArray: '4 6', fillOpacity: 0.08 }}
    >
      <CircleMarker
        center={[o.lat, o.lng]}
        radius={6}
        pathOptions={{ color: '#fff', weight: 2, fillColor: '#7c3aed', fillOpacity: 1 }}
      >
        <Tooltip direction="top">{o.label}</Tooltip>
      </CircleMarker>
    </Circle>
  ));
}
