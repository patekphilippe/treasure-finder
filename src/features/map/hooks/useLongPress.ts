import type { LeafletMouseEvent } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { useUiStore } from '@/shared/store/useUiStore';

/**
 * Long press (touch) or right click (mouse) on the map starts a new point there.
 * Leaflet reports both as `contextmenu`.
 */
export function useLongPress(): void {
  const map = useMap();

  useEffect(() => {
    const onPress = (e: LeafletMouseEvent) => {
      if (useUiStore.getState().mode !== 'field') return;
      e.originalEvent.preventDefault();
      usePointDraftStore.getState().placeFromMap(e.latlng.lat, e.latlng.lng);
      useUiStore.getState().showSheet('addPoint');
      navigator.vibrate?.(30);
    };
    map.on('contextmenu', onPress);
    return () => {
      map.off('contextmenu', onPress);
    };
  }, [map]);
}
