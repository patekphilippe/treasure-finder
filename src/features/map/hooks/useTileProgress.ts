import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

export interface TileProgress {
  done: number;
  total: number;
}

/**
 * Tiles requested and finished across every tile layer on the map since loading started;
 * null when nothing is loading. A burst ends when all requested tiles have arrived (or failed).
 */
export function useTileProgress(): TileProgress | null {
  const map = useMap();
  const [progress, setProgress] = useState<TileProgress | null>(null);

  useEffect(() => {
    const pending = new Set<HTMLElement>();
    let total = 0;
    const update = () => {
      if (pending.size === 0) {
        total = 0;
        setProgress(null);
      } else setProgress({ done: total - pending.size, total });
    };
    const onStart = (e: L.TileEvent) => {
      pending.add(e.tile);
      total++;
      update();
    };
    // load, error, or dropped when the view moved on before it arrived
    const onEnd = (e: L.TileEvent) => {
      if (pending.delete(e.tile)) update();
    };
    const handlers = {
      tileloadstart: onStart,
      tileload: onEnd,
      tileerror: onEnd,
      tileunload: onEnd,
    } as L.LeafletEventHandlerFnMap;
    const attach = (layer: L.Layer) => {
      if (layer instanceof L.GridLayer) layer.on(handlers);
    };
    const detach = (layer: L.Layer) => {
      if (layer instanceof L.GridLayer) layer.off(handlers);
    };
    map.eachLayer(attach);
    const onAdd = (e: L.LayerEvent) => attach(e.layer);
    const onRemove = (e: L.LayerEvent) => detach(e.layer);
    map.on('layeradd', onAdd);
    map.on('layerremove', onRemove);
    return () => {
      map.off('layeradd', onAdd);
      map.off('layerremove', onRemove);
      map.eachLayer(detach);
    };
  }, [map]);

  return progress;
}
