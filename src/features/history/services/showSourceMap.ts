import { findHistoricalLayer, useLayersStore } from '@/features/layers';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import type { MapRef } from '@/shared/types/domain';
import { useOwnMapsStore } from '../store/useOwnMapsStore';

/** zoom the map shows an object at: close enough for the archival orthophoto (from 14) */
const SHOW_ZOOM = 16;

/**
 * Shows the map an object was seen on and flies to the object: an own map becomes the only
 * visible own map, an online map is chosen (with its year) and own maps are hidden, since they
 * lie on top. False when the map no longer exists.
 */
export async function showSourceMap(
  map: MapRef,
  at: { lat: number; lng: number } | null,
): Promise<boolean> {
  const own = useOwnMapsStore.getState();
  if (map.kind === 'own') {
    if (!own.maps.some((m) => m.id === map.id)) return false;
    for (const m of own.maps)
      if (m.visible !== (m.id === map.id)) await own.update(m.id, { visible: m.id === map.id });
  } else if (map.kind === 'wms') {
    if (!findHistoricalLayer(map.id)) return false;
    const layers = useLayersStore.getState();
    layers.setHistoricalId(map.id);
    if (map.time !== undefined) layers.setHistoricalYear(map.time);
    for (const m of own.maps) if (m.visible) await own.update(m.id, { visible: false });
  } else return false;
  if (at)
    useMapViewStore.getState().flyTo({ ...at, zoom: SHOW_ZOOM, offsetY: bottomSheetOffset() });
  return true;
}
