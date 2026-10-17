import L from 'leaflet';

const cache = new Map<string, L.DivIcon>();

/** Numbered circle in the place's category colour. */
export function areaIcon(no: number, color: string, dimmed: boolean, selected: boolean): L.DivIcon {
  const key = `${no}|${color}|${dimmed}|${selected}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = selected ? 34 : 26;
  const icon = L.divIcon({
    className: 'area-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;
      color:#fff;font:700 ${selected ? 14 : 12}px Inter,system-ui,sans-serif;opacity:${dimmed ? 0.55 : 1}">${no}</div>`,
  });
  cache.set(key, icon);
  return icon;
}
