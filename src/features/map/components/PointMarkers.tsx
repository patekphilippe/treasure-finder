import { Marker } from 'react-leaflet';
import { POINT_TYPES, usePointsStore } from '@/features/points';
import { useUiStore } from '@/shared/store/useUiStore';
import { pointIcon } from '../utils/pointIcon';

export function PointMarkers() {
  const points = usePointsStore((s) => s.points);
  const showPoint = useUiStore((s) => s.showPoint);
  const selectedId = useUiStore((s) =>
    s.activeSheet === 'pointDetails' ? s.selectedPointId : null,
  );

  return points.map((point) => {
    const meta = POINT_TYPES[point.type];
    const dimmed = point.status === 'pusto' || point.status === 'odrzucony';
    return (
      <Marker
        key={point.id}
        position={[point.lat, point.lng]}
        icon={pointIcon(meta.color, meta.icon, dimmed, point.id === selectedId)}
        title={point.name}
        zIndexOffset={point.id === selectedId ? 1000 : 0}
        eventHandlers={{ click: () => showPoint(point.id) }}
      />
    );
  });
}
