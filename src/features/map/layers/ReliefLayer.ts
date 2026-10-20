import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import {
  RELIEF_BOUNDS,
  RELIEF_MAX_NATIVE_ZOOM,
  RELIEF_MIN_ZOOM,
  RELIEF_TILE_URL,
} from '@/shared/config/backend';
import { NMT_SOURCE } from '@/shared/config/geoportalWmts2180';
import { ReliefGridLayer } from './ReliefGridLayer';

interface ReliefLayerProps extends LayerProps {
  opacity: number;
  zIndex?: number;
  maxZoom?: number;
}

/**
 * The shading with the backend: our 16-direction hillshade of the GUGiK NMT from zoom 12
 * (server/src/relief), the Geoportal's own below and as a stand-in while a tile is rendered.
 */
export const ReliefLayer = createLayerComponent<ReliefGridLayer, ReliefLayerProps>(
  ({ opacity, zIndex, maxZoom }, ctx) => ({
    instance: new ReliefGridLayer({
      url: RELIEF_TILE_URL,
      firstZoom: RELIEF_MIN_ZOOM,
      standIn: NMT_SOURCE,
      opacity,
      zIndex,
      maxZoom,
      maxNativeZoom: RELIEF_MAX_NATIVE_ZOOM,
      bounds: RELIEF_BOUNDS,
      attribution:
        'NMT &copy; <a href="https://www.geoportal.gov.pl">GUGiK</a>, cieniowanie własne',
    }),
    context: ctx,
  }),
  (layer, props, prev) => {
    if (props.opacity !== prev.opacity) layer.setOpacity(props.opacity);
    if (props.zIndex !== undefined && props.zIndex !== prev.zIndex) layer.setZIndex(props.zIndex);
  },
);
