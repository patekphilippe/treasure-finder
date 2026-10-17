import type { MultiPolygon, Polygon } from 'geojson';
import type { TrackVertex } from '@/shared/types/domain';

export interface Coverage {
  /** 0–100 */
  percent: number;
  zoneAreaM2: number;
  coveredM2: number;
}

const M_PER_DEG_LAT = 110_540;
const MAX_CELLS = 6_000_000;

/**
 * Share of a zone covered by searched swaths: the zone and the track lines buffered
 * by half the swath width are rasterised on a `cellM` grid (default 0.5 m) in a local
 * equirectangular projection; overlapping passes count once.
 */
export function coveragePercent(
  zone: Polygon | MultiPolygon,
  segments: readonly (readonly TrackVertex[])[],
  swathM: number,
  cellM = 0.5,
): Coverage {
  const rings = zone.type === 'Polygon' ? zone.coordinates : zone.coordinates.flat();
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity; // prettier-ignore
  for (const ring of rings)
    for (const [lng, lat] of ring as [number, number][]) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng); // prettier-ignore
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat); // prettier-ignore
    }
  const lat0 = (minLat + maxLat) / 2;
  const mx = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const toX = (lng: number) => (lng - minLng) * mx;
  const toY = (lat: number) => (maxLat - lat) * M_PER_DEG_LAT; // row 0 at the north edge
  const width = toX(maxLng);
  const height = toY(minLat);
  let cell = cellM;
  while ((width / cell) * (height / cell) > MAX_CELLS) cell *= 2;
  const nx = Math.max(1, Math.ceil(width / cell));
  const ny = Math.max(1, Math.ceil(height / cell));

  // zone mask: even–odd scanline fill (handles holes and multipolygons)
  const inZone = new Uint8Array(nx * ny);
  const edges = rings.flatMap((ring) =>
    (ring as [number, number][]).slice(1).map((p, i) => {
      const q = ring[i] as [number, number];
      return [toX(q[0]), toY(q[1]), toX(p[0]), toY(p[1])] as const;
    }),
  );
  let zoneCells = 0;
  for (let row = 0; row < ny; row++) {
    const y = (row + 0.5) * cell;
    const xs: number[] = [];
    for (const [x1, y1, x2, y2] of edges) {
      if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k]! / cell - 0.5));
      const to = Math.min(nx - 1, Math.floor(xs[k + 1]! / cell - 0.5));
      for (let col = from; col <= to; col++) {
        inZone[row * nx + col] = 1;
        zoneCells++;
      }
    }
  }

  // swaths: mark zone cells within r of any track segment
  const r = swathM / 2;
  const covered = new Uint8Array(nx * ny);
  let coveredCells = 0;
  const mark = (ax: number, ay: number, bx: number, by: number) => {
    const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - r) / cell));
    const c1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx) + r) / cell));
    const r0 = Math.max(0, Math.floor((Math.min(ay, by) - r) / cell));
    const r1 = Math.min(ny - 1, Math.floor((Math.max(ay, by) + r) / cell));
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy; // prettier-ignore
    for (let row = r0; row <= r1; row++) {
      const py = (row + 0.5) * cell;
      for (let col = c0; col <= c1; col++) {
        const i = row * nx + col;
        if (!inZone[i] || covered[i]) continue;
        const px = (col + 0.5) * cell;
        const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
        if (Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) <= r) {
          covered[i] = 1;
          coveredCells++;
        }
      }
    }
  };
  for (const seg of segments) {
    for (let k = 0; k < seg.length; k++) {
      const a = seg[k]!;
      const b = seg[Math.min(k + 1, seg.length - 1)]!;
      if (k > 0 && k === seg.length - 1) break;
      mark(toX(a[1]), toY(a[0]), toX(b[1]), toY(b[0]));
    }
  }

  const area = cell * cell;
  return {
    percent: zoneCells ? (coveredCells / zoneCells) * 100 : 0,
    zoneAreaM2: zoneCells * area,
    coveredM2: coveredCells * area,
  };
}
