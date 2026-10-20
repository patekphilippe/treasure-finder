import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** the OSM attribution guidelines allow folding the credits automatically after five seconds */
const OPEN_MS = 5000;

/**
 * Map data credits (OSM, GUGiK, UMWD) behind an ⓘ in the map's corner: open when the map
 * appears, folded after 5 s or at the first touch of the map, a tap opens them again. The OSM
 * guidelines allow this as long as the credits stay findable; the "Leaflet" link is dropped.
 */
export function useCompactAttribution(): void {
  const map = useMap();
  useEffect(() => {
    const control = map.attributionControl;
    const box = control?.getContainer();
    if (!control || !box) return;
    control.setPrefix(false);
    box.classList.add('tf-attribution');
    box.setAttribute('role', 'button');
    box.tabIndex = 0;
    const set = (open: boolean) => {
      box.classList.toggle('tf-attribution--open', open);
      box.setAttribute('aria-expanded', String(open));
      box.setAttribute('aria-label', open ? 'Zwiń źródła danych mapy' : 'Źródła danych mapy');
    };
    const toggle = () => set(!box.classList.contains('tf-attribution--open'));
    const onClick = (e: MouseEvent) => {
      // links in the credits open their page
      if (!(e.target as Element).closest('a')) toggle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggle();
    };
    const onMapTouch = (e: Event) => {
      if (!box.contains(e.target as Node)) set(false);
    };
    const mapBox = map.getContainer();

    set(true);
    const timer = window.setTimeout(() => set(false), OPEN_MS);
    L.DomEvent.disableClickPropagation(box);
    box.addEventListener('click', onClick);
    box.addEventListener('keydown', onKey);
    mapBox.addEventListener('pointerdown', onMapTouch);
    mapBox.addEventListener('wheel', onMapTouch, { passive: true });
    return () => {
      window.clearTimeout(timer);
      box.removeEventListener('click', onClick);
      box.removeEventListener('keydown', onKey);
      mapBox.removeEventListener('pointerdown', onMapTouch);
      mapBox.removeEventListener('wheel', onMapTouch);
    };
  }, [map]);
}
