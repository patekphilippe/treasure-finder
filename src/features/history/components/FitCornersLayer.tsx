import { Marker } from 'react-leaflet';
import { fromEpsg2180 } from '@/shared/lib/geo';
import { useCornerDrag } from '../hooks/useCornerDrag';
import { mapCorners2180 } from '../services/importOwnMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { cornerIcon } from '../utils/cornerIcon';

const ICONS = [1, 2, 3, 4].map(cornerIcon);

/** Four draggable corners of the map being fitted; the image follows them live. */
export function FitCornersLayer() {
  const fitting = useOwnMapsStore((s) => s.fitting);
  const map = useOwnMapsStore((s) => s.maps.find((m) => m.id === s.fitting?.id));
  const drag = useCornerDrag();
  if (!fitting || !map) return null;

  return mapCorners2180(map).map((c, i) => {
    const [lat, lng] = fromEpsg2180(c.x, c.y);
    return (
      <Marker
        key={i}
        position={[lat, lng]}
        icon={ICONS[i]!}
        draggable
        zIndexOffset={1000}
        eventHandlers={{
          drag: (e) => drag(i, e, false),
          dragend: (e) => drag(i, e, true),
        }}
      />
    );
  });
}
