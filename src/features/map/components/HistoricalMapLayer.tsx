import { useMemo } from 'react';
import { findHistoricalLayer, historicalWmsParams, useLayersStore } from '@/features/layers';
import { MAX_ZOOM } from '../config/mapLayers';
import { PoliteWmsTileLayer } from '../layers/PoliteWmsTileLayer';
import { Wms2180Layer } from '../layers/Wms2180Layer';

/** The chosen historical map (WMS, online only), above the base map and below custom layers. */
export function HistoricalMapLayer() {
  const historicalId = useLayersStore((s) => s.historicalId);
  const opacity = useLayersStore((s) => s.historicalOpacity);
  const year = useLayersStore((s) => s.historicalYear);
  const layer = findHistoricalLayer(historicalId);
  const params = useMemo(
    () => ({
      layers: layer?.layers ?? '',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      ...(layer ? historicalWmsParams(layer, year) : {}),
    }),
    [layer, year],
  );

  if (!layer) return null;
  if (layer.ask2180)
    return (
      <Wms2180Layer
        key={`${layer.id}-${JSON.stringify(params)}`}
        url={layer.url}
        layers={layer.layers}
        params={historicalWmsParams(layer, year)}
        attribution={layer.attribution}
        tileSize={512}
        maxParallel={layer.maxParallel}
        opacity={opacity}
        minZoom={layer.minZoom}
        maxZoom={MAX_ZOOM}
        zIndex={5}
      />
    );
  return (
    <PoliteWmsTileLayer
      key={layer.id}
      url={layer.url}
      params={params}
      attribution={layer.attribution}
      tileSize={512}
      maxParallel={layer.maxParallel}
      opacity={opacity}
      minZoom={layer.minZoom}
      maxNativeZoom={layer.maxNativeZoom}
      maxZoom={MAX_ZOOM}
      zIndex={5}
    />
  );
}
