import L from 'leaflet';
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
    const zoom = flyTarget.zoom ?? Math.max(map.getZoom(), FOLLOW_ZOOM);
    let center = L.latLng(flyTarget.lat, flyTarget.lng);
    if (flyTarget.offsetY) {
      // move the view centre below the target so the target ends up offsetY px higher
      center = map.unproject(map.project(center, zoom).add([0, flyTarget.offsetY]), zoom);
    }
    map.flyTo(center, zoom, { duration: 0.6 });
    clearFly();
  }, [flyTarget, map, clearFly]);
}
