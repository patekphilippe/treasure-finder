import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { FOLLOW_ZOOM } from '../config/mapLayers';

/** Keeps the map centred on the user while following; dragging the map stops following. */
export function useFollowPosition(): void {
  const map = useMap();
  const following = useFieldStore((s) => s.following);
  const position = useFieldStore((s) => s.position);
  const setFollowing = useFieldStore((s) => s.setFollowing);
  const centered = useRef(false);

  useEffect(() => {
    const stop = () => setFollowing(false);
    map.on('dragstart', stop);
    return () => {
      map.off('dragstart', stop);
    };
  }, [map, setFollowing]);

  useEffect(() => {
    if (!following) {
      centered.current = false;
      return;
    }
    if (!position) return;
    const latLng: [number, number] = [position.lat, position.lng];
    if (!centered.current) {
      map.setView(latLng, Math.max(map.getZoom(), FOLLOW_ZOOM));
      centered.current = true;
    } else {
      map.panTo(latLng);
    }
  }, [following, position, map]);
}
