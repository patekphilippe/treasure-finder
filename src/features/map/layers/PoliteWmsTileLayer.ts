import { createTileLayerComponent, updateGridLayer, type LayerProps } from '@react-leaflet/core';
import type { WMSParams } from 'leaflet';
import { PoliteWmsLayer, type PoliteWmsOptions } from './PoliteWmsLayer';

interface PoliteWmsTileLayerProps extends PoliteWmsOptions, LayerProps {
  url: string;
  params?: WMSParams & Record<string, unknown>;
}

/** react-leaflet wrapper for PoliteWmsLayer (same props as WMSTileLayer plus maxParallel). */
export const PoliteWmsTileLayer = createTileLayerComponent<PoliteWmsLayer, PoliteWmsTileLayerProps>(
  ({ url, params = {}, ...options }, ctx) => ({
    instance: new PoliteWmsLayer(url, { ...params, ...options }),
    context: ctx,
  }),
  (layer, props, prevProps) => {
    updateGridLayer(layer, props, prevProps);
    if (props.params != null && props.params !== prevProps.params) layer.setParams(props.params);
  },
);
