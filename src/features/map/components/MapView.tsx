import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet';
import { useLayersStore } from '@/features/layers';
import {
  DEFAULT_ZOOM,
  GEOPORTAL_WMS_OPTIONS,
  MAX_ZOOM,
  NMT_SHADED_WMS_URL,
  ORTHO_WMS_URL,
  OSM_LAYER,
  POLAND_CENTER,
} from '../config/mapLayers';

export function MapView() {
  const { baseLayer, nmtOn, nmtOpacity } = useLayersStore();

  return (
    <MapContainer
      style={{ position: 'absolute', inset: 0 }}
      center={POLAND_CENTER}
      zoom={DEFAULT_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomControl={false}
    >
      {baseLayer === 'osm' ? (
        <TileLayer
          key="osm"
          url={OSM_LAYER.url}
          attribution={OSM_LAYER.attribution}
          maxNativeZoom={OSM_LAYER.maxNativeZoom}
          maxZoom={MAX_ZOOM}
        />
      ) : (
        <WMSTileLayer
          key="ortho"
          url={ORTHO_WMS_URL}
          {...GEOPORTAL_WMS_OPTIONS}
          maxZoom={MAX_ZOOM}
        />
      )}
      {nmtOn && (
        <WMSTileLayer
          url={NMT_SHADED_WMS_URL}
          {...GEOPORTAL_WMS_OPTIONS}
          transparent
          opacity={nmtOpacity}
          maxZoom={MAX_ZOOM}
        />
      )}
    </MapContainer>
  );
}
