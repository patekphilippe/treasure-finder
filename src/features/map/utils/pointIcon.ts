import L from 'leaflet';

const cache = new Map<string, L.DivIcon>();

/** Teardrop pin with a Line Awesome glyph; cached per colour/icon/state. */
export function pointIcon(
  color: string,
  icon: string,
  dimmed = false,
  selected = false,
): L.DivIcon {
  const key = `${color}|${icon}|${dimmed}|${selected}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = selected ? 38 : 32;
  const created = L.divIcon({
    className: 'point-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 1.2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
      display:grid;place-items:center;opacity:${dimmed ? 0.55 : 1}">
      <i class="las la-${icon}" style="transform:rotate(45deg);color:#fff;font-size:${size * 0.55}px"></i>
    </div>`,
  });
  cache.set(key, created);
  return created;
}
