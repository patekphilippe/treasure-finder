import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { NMT_WMTS_2180 } from '../config/geoportalWmts2180';
import { Wmts2180GridLayer } from './Wmts2180GridLayer';

interface NmtShadedLayerProps extends LayerProps {
  opacity: number;
  zIndex?: number;
  maxZoom?: number;
}

/** Geoportal NMT hillshade from its fast EPSG:2180 WMTS, reprojected tile by tile. */
export const NmtShadedLayer = createLayerComponent<Wmts2180GridLayer, NmtShadedLayerProps>(
  ({ opacity, zIndex, maxZoom, ...options }, ctx) => ({
    instance: new Wmts2180GridLayer(NMT_WMTS_2180, {
      ...options,
      opacity,
      zIndex,
      maxZoom,
      attribution: '&copy; <a href="https://www.geoportal.gov.pl">GUGiK</a>',
    }),
    context: ctx,
  }),
  (layer, props, prev) => {
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity);
    if (props.zIndex !== undefined && props.zIndex !== prev.zIndex) layer.setZIndex(props.zIndex);
  },
);
