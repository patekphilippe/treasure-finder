import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

export interface TileProgress {
  done: number;
  total: number;
}

/** With no tile event for this long the burst is treated as over (a request that never ends). */
const STALL_MS = 15_000;

/**
 * Tiles requested and finished across every tile layer on the map since loading started;
 * null when nothing is loading. A burst ends when all requested tiles have arrived, failed,
 * been aborted or dropped, or their layer left the map.
 */
export function useTileProgress(): TileProgress | null {
  const map = useMap();
  const [progress, setProgress] = useState<TileProgress | null>(null);

  useEffect(() => {
    // tile → its layer, so a removed layer takes its unfinished tiles with it
    const pending = new Map<HTMLElement, L.Layer>();
    let total = 0;
    let stall: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(stall);
      if (pending.size === 0) {
        total = 0;
        setProgress(null);
        return;
      }
      setProgress({ done: total - pending.size, total });
      stall = setTimeout(() => {
        pending.clear();
        update();
      }, STALL_MS);
    };
    const onStart = (e: L.TileEvent) => {
      pending.set(e.tile, e.target as L.Layer);
      total++;
      update();
    };
    // load, error, aborted on zoom, or dropped when the view moved on
    const onEnd = (e: L.TileEvent) => {
      if (pending.delete(e.tile)) update();
    };
    const handlers = {
      tileloadstart: onStart,
      tileload: onEnd,
      tileerror: onEnd,
      tileabort: onEnd,
      tileunload: onEnd,
    } as L.LeafletEventHandlerFnMap;
    const attach = (layer: L.Layer) => {
      if (layer instanceof L.GridLayer) layer.on(handlers);
    };
    const detach = (layer: L.Layer) => {
      if (!(layer instanceof L.GridLayer)) return;
      layer.off(handlers);
      let changed = false;
      for (const [tile, owner] of pending)
        if (owner === layer) {
          pending.delete(tile);
          changed = true;
        }
      if (changed) update();
    };
    map.eachLayer(attach);
    const onAdd = (e: L.LayerEvent) => attach(e.layer);
    const onRemove = (e: L.LayerEvent) => detach(e.layer);
    map.on('layeradd', onAdd);
    map.on('layerremove', onRemove);
    return () => {
      clearTimeout(stall);
      map.off('layeradd', onAdd);
      map.off('layerremove', onRemove);
      map.eachLayer(detach);
    };
  }, [map]);

  return progress;
}
