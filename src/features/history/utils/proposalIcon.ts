import L from 'leaflet';

/** Numbered violet marker of an AI proposal (other colours than the uneven-ground places). */
export const proposalIcon = (n: number) =>
  L.divIcon({
    className: 'ai-proposal',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);color:#fff;font:700 12px Inter,sans-serif;display:grid;place-items:center">${n}</div>`,
  });
