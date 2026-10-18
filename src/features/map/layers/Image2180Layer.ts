import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { Image2180GridLayer, type Image2180 } from './Image2180GridLayer';

interface Image2180LayerProps extends LayerProps {
  source: Image2180;
  opacity?: number;
  zIndex?: number;
}

/** An in-memory image on the EPSG:2180 grid (e.g. a mask computed for an NMT sheet). */
export const Image2180Layer = createLayerComponent<Image2180GridLayer, Image2180LayerProps>(
  ({ source, opacity = 1, zIndex = 55 }, ctx) => ({
    instance: new Image2180GridLayer(source, { opacity, zIndex, maxZoom: 21 }),
    context: ctx,
  }),
  (layer, props, prev) => {
    if (props.source !== prev.source) layer.setSource(props.source);
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity ?? 1);
  },
);
