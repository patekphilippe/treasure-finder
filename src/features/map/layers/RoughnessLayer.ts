import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { Image2180GridLayer, type Image2180 } from './Image2180GridLayer';

interface RoughnessLayerProps extends LayerProps {
  source: Image2180;
  opacity: number;
}

/** Heat overlay of the "uneven ground" analysis, on top of the base map and NMT. */
export const RoughnessLayer = createLayerComponent<Image2180GridLayer, RoughnessLayerProps>(
  ({ source, opacity }, ctx) => ({
    instance: new Image2180GridLayer(source, { opacity, zIndex: 60, maxZoom: 21 }),
    context: ctx,
  }),
  (layer, props, prev) => {
    if (props.source !== prev.source) layer.setSource(props.source);
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity);
  },
);
