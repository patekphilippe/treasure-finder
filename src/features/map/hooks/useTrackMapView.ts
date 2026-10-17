import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapViewStore } from '@/shared/store/useMapViewStore';

/** Publishes the map centre and zoom after every move. */
export function useTrackMapView(): void {
  const map = useMap();
  const setView = useMapViewStore((s) => s.setView);

  useEffect(() => {
    const update = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      setView({ lat: c.lat, lng: c.lng }, map.getZoom(), {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    };
    update();
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, [map, setView]);
}
