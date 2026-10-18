import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Drops the "Leaflet" link from the attribution; map data credits (OSM, GUGiK) stay as licences require. */
export function useAttributionPrefix(): void {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
}
