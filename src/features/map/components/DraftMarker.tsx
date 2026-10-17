import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { pointIcon } from '../utils/pointIcon';

/** Where the point being added will land (crosshair / long-press sources). */
export function DraftMarker() {
  const open = useUiStore((s) => s.activeSheet === 'addPoint');
  const { source, location, picking } = usePointDraftStore();
  const icon = useMemo(() => pointIcon('#18181b', 'plus', false, true), []);

  if (!open || picking || source === 'gps' || !location) return null;
  return <Marker position={[location.lat, location.lng]} icon={icon} interactive={false} />;
}
