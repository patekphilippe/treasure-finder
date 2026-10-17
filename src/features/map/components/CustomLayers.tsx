import { TileLayer, WMSTileLayer } from 'react-leaflet';
import { useLayersStore } from '@/features/layers';
import { MAX_ZOOM } from '../config/mapLayers';

/** User-defined XYZ / WMS layers, drawn above the base map in list order. */
export function CustomLayers() {
  const layers = useLayersStore((s) => s.customLayers);

  return layers
    .filter((l) => l.on)
    .map((layer, i) =>
      layer.kind === 'xyz' ? (
        <TileLayer
          key={layer.id}
          url={layer.url}
          opacity={layer.opacity}
          maxNativeZoom={layer.maxNativeZoom}
          maxZoom={MAX_ZOOM}
          zIndex={10 + i}
        />
      ) : (
        <WMSTileLayer
          key={layer.id}
          url={layer.url}
          layers={layer.layers ?? ''}
          format="image/png"
          transparent
          version="1.3.0"
          tileSize={512}
          opacity={layer.opacity}
          maxNativeZoom={layer.maxNativeZoom}
          maxZoom={MAX_ZOOM}
          zIndex={10 + i}
        />
      ),
    );
}
