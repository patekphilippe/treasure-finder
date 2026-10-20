import { useCompactAttribution } from '../hooks/useCompactAttribution';
import { useFlyTo } from '../hooks/useFlyTo';
import { useFollowPosition } from '../hooks/useFollowPosition';
import { useLongPress } from '../hooks/useLongPress';
import { useTrackMapView } from '../hooks/useTrackMapView';

/** Renderless child of MapContainer wiring map events to the stores. */
export function MapEvents() {
  useFollowPosition();
  useTrackMapView();
  useLongPress();
  useFlyTo();
  useCompactAttribution();
  return null;
}
