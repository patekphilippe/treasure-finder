import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapCreditsStore } from '../store/useMapCreditsStore';
import { collectCredits } from '../utils/collectCredits';

/** the OSM attribution guidelines allow folding the credits automatically after five seconds */
const OPEN_MS = 5000;

/**
 * Keeps the credits of the layers on the map in the store for the ⓘ next to the GPS chip (Leaflet's
 * own attribution box is off) and folds them after 5 s or at the first touch of the map.
 */
export function useMapCredits(): void {
  const map = useMap();
  useEffect(() => {
    const { setCredits, setOpen } = useMapCreditsStore.getState();
    // many markers come in one render: the credits are read once after it
    let pending = false;
    const update = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        const credits = collectCredits(map);
        if (credits.join('\n') !== useMapCreditsStore.getState().credits.join('\n'))
          setCredits(credits);
      });
    };
    const fold = () => setOpen(false);
    const box = map.getContainer();

    update();
    const timer = window.setTimeout(fold, OPEN_MS);
    map.on('layeradd layerremove', update);
    box.addEventListener('pointerdown', fold);
    box.addEventListener('wheel', fold, { passive: true });
    return () => {
      window.clearTimeout(timer);
      map.off('layeradd layerremove', update);
      box.removeEventListener('pointerdown', fold);
      box.removeEventListener('wheel', fold);
    };
  }, [map]);
}
