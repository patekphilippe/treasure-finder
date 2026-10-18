import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { Wms2180GridLayer, type Wms2180Options } from './Wms2180GridLayer';

type Wms2180LayerProps = LayerProps & Wms2180Options & { opacity?: number; zIndex?: number };

/** react-leaflet wrapper for a WMS asked in EPSG:2180 and warped onto the map. */
export const Wms2180Layer = createLayerComponent<Wms2180GridLayer, Wms2180LayerProps>(
  (props, ctx) => ({ instance: new Wms2180GridLayer(props), context: ctx }),
  (layer, props, prev) => {
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity ?? 1);
    if (props.zIndex !== undefined && props.zIndex !== prev.zIndex) layer.setZIndex(props.zIndex);
  },
);
