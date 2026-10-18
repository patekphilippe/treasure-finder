import L from 'leaflet';
import { CONTEXT_KINDS, type ContextKind } from '../config/contextKinds';

const cache = new Map<string, L.DivIcon>();

/** Rounded square with the kind's icon, so context objects differ from round point markers. */
export function contextIcon(kind: ContextKind, selected: boolean): L.DivIcon {
  const key = `${kind}|${selected}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { icon, color } = CONTEXT_KINDS[kind];
  const size = selected ? 34 : 26;
  const made = L.divIcon({
    className: 'context-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:8px;background:${color};
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;
      color:#fff;font-size:${selected ? 20 : 16}px"><i class="las la-${icon}"></i></div>`,
  });
  cache.set(key, made);
  return made;
}
