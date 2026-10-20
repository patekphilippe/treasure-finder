import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { CachedWms2180GridLayer, type CachedWms2180Options } from './CachedWms2180GridLayer';

type HistoricalWms2180LayerProps = LayerProps &
  CachedWms2180Options & { opacity?: number; zIndex?: number };

/** react-leaflet wrapper for a slow historical WMS asked in EPSG:2180 as cached grid tiles. */
export const HistoricalWms2180Layer = createLayerComponent<
  CachedWms2180GridLayer,
  HistoricalWms2180LayerProps
>(
  (props, ctx) => ({ instance: new CachedWms2180GridLayer(props), context: ctx }),
  (layer, props, prev) => {
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity ?? 1);
    if (props.zIndex !== undefined && props.zIndex !== prev.zIndex) layer.setZIndex(props.zIndex);
  },
);
