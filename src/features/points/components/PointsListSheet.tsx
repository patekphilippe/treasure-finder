import Stack from '@mui/material/Stack';
import { useMemo } from 'react';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { EmptyState, Sheet } from '@/shared/ui';
import { usePointsStore } from '../store/usePointsStore';
import { sortByDistance } from '../utils/sortByDistance';
import { PointListItem } from './PointListItem';

interface PointsListSheetProps {
  onClose: () => void;
}

export function PointsListSheet({ onClose }: PointsListSheetProps) {
  const points = usePointsStore((s) => s.points);
  const position = useFieldStore((s) => s.position);
  const showPoint = useUiStore((s) => s.showPoint);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const sorted = useMemo(() => sortByDistance(points, position), [points, position]);

  return (
    <Sheet title={`Punkty (${points.length})`} onClose={onClose}>
      {sorted.length === 0 ? (
        <EmptyState
          icon="map-marker-alt"
          title="Brak punktów"
          description="Dodaj punkt przyciskiem na dole albo przytrzymaj palec na mapie."
        />
      ) : (
        <Stack>
          {sorted.map(({ point, distM }) => (
            <PointListItem
              key={point.id}
              point={point}
              distM={distM}
              onClick={() => {
                flyTo({ lat: point.lat, lng: point.lng, offsetY: bottomSheetOffset() });
                showPoint(point.id);
              }}
            />
          ))}
        </Stack>
      )}
    </Sheet>
  );
}
