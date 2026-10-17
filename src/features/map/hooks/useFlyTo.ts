import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { FOLLOW_ZOOM } from '../config/mapLayers';

/** Executes fly-to requests from the rest of the app (e.g. tapping a point in the list). */
export function useFlyTo(): void {
  const map = useMap();
  const flyTarget = useMapViewStore((s) => s.flyTarget);
  const clearFly = useMapViewStore((s) => s.clearFly);

  useEffect(() => {
    if (!flyTarget) return;
    useFieldStore.getState().setFollowing(false);
    map.flyTo(
      [flyTarget.lat, flyTarget.lng],
      flyTarget.zoom ?? Math.max(map.getZoom(), FOLLOW_ZOOM),
      {
        duration: 0.6,
      },
    );
    clearFly();
  }, [flyTarget, map, clearFly]);
}
