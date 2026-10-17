import { useTheme } from '@mui/material/styles';
import { Polyline } from 'react-leaflet';
import { usePointsStore } from '@/features/points';
import { useFieldStore } from '@/shared/store/useFieldStore';

/** Dashed line from the user to the navigation target. */
export function GuidanceLine() {
  const theme = useTheme();
  const position = useFieldStore((s) => s.position);
  const targetId = useFieldStore((s) => s.navigationTargetId);
  const target = usePointsStore((s) => s.points.find((p) => p.id === targetId));

  if (!position || !target) return null;
  return (
    <Polyline
      positions={[
        [position.lat, position.lng],
        [target.lat, target.lng],
      ]}
      interactive={false}
      pathOptions={{ color: theme.palette.primary.main, weight: 3, dashArray: '6 8', opacity: 0.9 }}
    />
  );
}
