import L from 'leaflet';

/** Numbered round handle for a corner being dragged while fitting a scan. */
export const cornerIcon = (n: number) =>
  L.divIcon({
    className: 'fit-corner',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;background:rgba(5,150,105,.9);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;font:700 13px Inter,sans-serif;display:grid;place-items:center">${n}</div>`,
  });
