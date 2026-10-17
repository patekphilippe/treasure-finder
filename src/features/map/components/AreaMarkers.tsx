import { Marker } from 'react-leaflet';
import { AREA_CATEGORIES, useAreasStore } from '@/features/roughness';
import { useUiStore } from '@/shared/store/useUiStore';
import { areaIcon } from '../utils/areaIcon';

/** Places marked by the uneven-ground analysis, numbered and coloured by category. */
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
      icon={areaIcon(
        a.no,
        AREA_CATEGORIES[a.category].color,
        a.category === 'nieistotne',
        a.id === selectedId,
      )}
      title={`Miejsce ${a.no}: ${AREA_CATEGORIES[a.category].label}`}
      zIndexOffset={a.id === selectedId ? 900 : -100}
      eventHandlers={{ click: () => showArea(a.id) }}
    />
  ));
}
