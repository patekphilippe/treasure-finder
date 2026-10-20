import L from 'leaflet';
import { CONTEXT_KINDS, type ContextKind } from '../config/contextKinds';

/** local: only on this device; shared: in the community base; disputed: the community doubts it */
export type ContextMarkerState = 'local' | 'shared' | 'disputed';

const cache = new Map<string, L.DivIcon>();
const SHARED_RING = '#7c3aed';

/** Rounded square with the kind's icon, so context objects differ from round point markers. */
export function contextIcon(
  kind: ContextKind,
  selected: boolean,
  state: ContextMarkerState = 'local',
): L.DivIcon {
  const key = `${kind}|${selected}|${state}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { icon, color } = CONTEXT_KINDS[kind];
  const size = selected ? 34 : 26;
  const fill = state === 'disputed' ? '#9ca3af' : color;
  const ring =
    state === 'local'
      ? '2px solid #fff'
      : `3px solid ${state === 'shared' ? SHARED_RING : '#6b7280'}`;
  const made = L.divIcon({
    className: 'context-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:8px;background:${fill};
      border:${ring};box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;
      color:#fff;font-size:${selected ? 20 : 16}px;opacity:${state === 'disputed' ? 0.75 : 1}"><i class="las la-${icon}"></i></div>`,
  });
  cache.set(key, made);
  return made;
}
