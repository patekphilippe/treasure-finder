import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { Wms2180ViewLayer, type Wms2180ViewOptions } from './Wms2180ViewLayer';

type Wms2180LayerProps = LayerProps & Wms2180ViewOptions & { opacity?: number; zIndex?: number };

/** react-leaflet wrapper for a slow WMS asked in EPSG:2180, one image per view, warped onto the map. */
export const Wms2180Layer = createLayerComponent<Wms2180ViewLayer, Wms2180LayerProps>(
  (props, ctx) => ({ instance: new Wms2180ViewLayer(props), context: ctx }),
  (layer, props, prev) => {
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity ?? 1);
    if (props.zIndex !== undefined && props.zIndex !== prev.zIndex) layer.setZIndex(props.zIndex);
  },
);
