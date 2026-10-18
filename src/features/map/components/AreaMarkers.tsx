import { Marker } from 'react-leaflet';
import { PLACE_COLOR, useAreasStore } from '@/features/roughness';
import { useUiStore } from '@/shared/store/useUiStore';
import { areaIcon } from '../utils/areaIcon';

/** Places marked by the uneven-ground map, numbered. */
export function AreaMarkers() {
  const areas = useAreasStore((s) => s.areas);
  const visible = useAreasStore((s) => s.visible);
  const showArea = useUiStore((s) => s.showArea);
  const selectedId = useUiStore((s) => (s.activeSheet === 'area' ? s.selectedAreaId : null));
  if (!visible) return null;

  return areas.map((a) => (
    <Marker
      key={a.id}
      position={[a.lat, a.lng]}
      icon={areaIcon(a.no, PLACE_COLOR, false, a.id === selectedId)}
      title={`Obszar do sprawdzenia ${a.no}`}
      zIndexOffset={a.id === selectedId ? 900 : -100}
      eventHandlers={{ click: () => showArea(a.id) }}
    />
  ));
}
