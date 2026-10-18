import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { WarpedImageGridLayer, type WarpedImage } from './WarpedImageGridLayer';

interface WarpedImageLayerProps extends LayerProps {
  source: WarpedImage;
  opacity?: number;
  zIndex?: number;
}

/** An own historical map warped onto the Web Mercator map. */
export const WarpedImageLayer = createLayerComponent<WarpedImageGridLayer, WarpedImageLayerProps>(
  ({ source, opacity = 1, zIndex = 40 }, ctx) => ({
    instance: new WarpedImageGridLayer(source, { opacity, zIndex, maxZoom: 21 }),
    context: ctx,
  }),
  (layer, props, prev) => {
    if (props.source !== prev.source) layer.setSource(props.source);
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity ?? 1);
  },
);
