import { createLayerComponent, type LayerProps } from '@react-leaflet/core';
import { TOPO_WMTS_2180 } from '@/shared/config/geoportalTopo';
import { Wmts2180GridLayer } from './Wmts2180GridLayer';

interface TopoLayerProps extends LayerProps {
  maxZoom?: number;
}

/** Geoportal topographic map 1:10 000 as the base layer, reprojected from EPSG:2180. */
export const TopoLayer = createLayerComponent<Wmts2180GridLayer, TopoLayerProps>(
  ({ maxZoom, ...options }, ctx) => ({
    instance: new Wmts2180GridLayer(TOPO_WMTS_2180, {
      ...options,
      maxZoom,
      attribution: '&copy; <a href="https://www.geoportal.gov.pl">GUGiK</a>',
    }),
    context: ctx,
  }),
);
