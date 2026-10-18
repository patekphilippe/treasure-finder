import type { Geometry } from 'geojson';
import type { Candidate } from '@/shared/types/domain';
import { fromEpsg2180, toEpsg2180 } from '../geo';
import type { DemGrid } from '../raster';
import type { XY } from './features/lines';
import { distanceToWater } from './features/water';
import { interpretConfig } from './interpretConfig';
import { detectForms, type Detection } from './pipeline';
import { buildScene } from './scene';
import { contextPriority, contextScore, distanceToGeometry, score } from './score';
import { forbiddenAreas, touchesAreas, withoutAreas } from './protection';
import { buildExclusionLocal, buildZoneLocal, hullBuffer, toWgs84 } from './searchZone';

export interface AnalyseOptions {
  sheetId: string;
  /** archival context features in WGS84 (settlements, roads, mills, inns, fords) */
  context?: Geometry[];
  /** extra water lines / areas in WGS84 (e.g. BDOT10k rivers) */
  water?: Geometry[];
  /** forbidden zones in WGS84 (user's 'zakaz' zones, protected forms of other sheets) */
  forbidden?: Geometry[];
  /** cells to skip (buildings, roads…), same size as the grid */
  exclude?: Uint8Array;
  onProgress?: (share: number, step: string) => void;
}

/** WGS84 geometry → local metres of the sheet. */
function toLocalGeometry(g: Geometry, grid: DemGrid): Geometry {
  const conv = (c: number[]): number[] => {
    const [e, n] = toEpsg2180(c[1]!, c[0]!);
    return [e - grid.originE, n - grid.originN];
  };
  switch (g.type) {
    case 'Point':
      return { type: 'Point', coordinates: conv(g.coordinates) };
    case 'MultiPoint':
      return { type: 'MultiPoint', coordinates: g.coordinates.map(conv) };
    case 'LineString':
      return { type: 'LineString', coordinates: g.coordinates.map(conv) };
    case 'MultiLineString':
      return { type: 'MultiLineString', coordinates: g.coordinates.map((l) => l.map(conv)) };
    case 'Polygon':
      return { type: 'Polygon', coordinates: g.coordinates.map((r) => r.map(conv)) };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: g.coordinates.map((p) => p.map((r) => r.map(conv))),
      };
    case 'GeometryCollection':
      return {
        type: 'GeometryCollection',
        geometries: g.geometries.map((x) => toLocalGeometry(x, grid)),
      };
  }
}

/**
 * Points along water geometries (local metres), every ~2 m, for distance checks. Only points
 * within `box` [x0, y0, x1, y1] are kept (a whole county of rivers would be millions).
 */
function samplePoints(g: Geometry, box: Box): XY[] {
  const out: XY[] = [];
  collectPoints(g, box, out);
  return out;
}

type Box = readonly [number, number, number, number];

function collectPoints(g: Geometry, box: Box, out: XY[]): void {
  const inBox = (x: number, y: number) => x >= box[0] && y >= box[1] && x <= box[2] && y <= box[3];
  const line = (pts: number[][]) => {
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1] as [number, number];
      const [bx, by] = pts[k] as [number, number];
      // segment entirely to one side of the box: nothing to sample
      if (
        Math.max(ax, bx) < box[0] ||
        Math.min(ax, bx) > box[2] ||
        Math.max(ay, by) < box[1] ||
        Math.min(ay, by) > box[3]
      )
        continue;
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
      for (let i = 0; i <= n; i++) {
        const x = ax + ((bx - ax) * i) / n;
        const y = ay + ((by - ay) * i) / n;
        if (inBox(x, y)) out.push([x, y]);
      }
    }
    if (pts.length === 1 && inBox(pts[0]![0]!, pts[0]![1]!)) out.push(pts[0] as XY);
  };
  switch (g.type) {
    case 'Point':
      line([g.coordinates]);
      break;
    case 'MultiPoint':
    case 'LineString':
      line(g.coordinates);
      break;
    case 'MultiLineString':
    case 'Polygon':
      g.coordinates.forEach(line);
      break;
    case 'MultiPolygon':
      g.coordinates.forEach((p) => p.forEach(line));
      break;
    case 'GeometryCollection':
      g.geometries.forEach((x) => collectPoints(x, box, out));
  }
}

const pad = (n: number) => String(n).padStart(4, '0');

/**
 * Detections → app candidates: context, score, priority, outline and zones in WGS84.
 * A form touching a forbidden area (exclusion zone of a protected form, a 'zakaz' zone) is
 * protected too; search zones never reach into forbidden areas.
 */
export function toCandidates(
  grid: DemGrid,
  detections: Detection[],
  opts: Pick<AnalyseOptions, 'sheetId' | 'context' | 'water' | 'forbidden'>,
  waterLocal: XY[],
  cfg = interpretConfig,
): Candidate[] {
  const context = (opts.context ?? []).map((g) => toLocalGeometry(g, grid));
  // roads as sampled points (every ~5th cell) for fast distance checks
  const roads = detections
    .filter((d) => d.interpretation === 'dawna_droga')
    .map((d) => ({
      d,
      pts: d.cells
        .filter((_, k) => k % 5 === 0)
        .map((i): XY => [
          ((i % grid.w) + 0.5) * grid.cell,
          -(((i / grid.w) | 0) + 0.5) * grid.cell,
        ]),
    }));
  const forbidden = forbiddenAreas(
    detections.map((d) => buildExclusionLocal(d.exclusion)),
    (opts.forbidden ?? []).map((g) => toLocalGeometry(g, grid)),
  );
  const ranked = [...detections].sort((a, b) => b.confidence - a.confidence);
  return ranked.map((d, k) => {
    const archivalM = context.length
      ? Math.min(...context.map((g) => distanceToGeometry(d.centre, g)))
      : Infinity;
    let roadM = Infinity;
    for (const r of roads) {
      if (r.d === d) continue;
      for (const [x, y] of r.pts) {
        const dd = Math.hypot(x - d.centre[0], y - d.centre[1]);
        if (dd < roadM) roadM = dd;
      }
    }
    const waterM = distanceToWater(d.centre, waterLocal).d;
    const ctx = contextScore(d.interpretation, { archivalM, roadM, waterM }, cfg);
    const reasons = [...d.reasons];
    if (archivalM <= cfg.score.contextMaxDistanceM)
      reasons.push(`obiekt z mapy archiwalnej ${Math.round(archivalM)} m dalej`);
    if (roadM <= cfg.score.roadBonusDistanceM)
      reasons.push(`dawna droga ${Math.round(roadM)} m dalej`);
    let priority = contextPriority(d.priority, ctx, cfg);
    if (priority !== d.priority) reasons.push('silny kontekst historyczny podnosi priorytet');
    const cellPts: XY[] = d.cells.map((i) => [
      ((i % grid.w) + 0.5) * grid.cell,
      -(((i / grid.w) | 0) + 0.5) * grid.cell,
    ]);
    if (
      d.exclusion === null &&
      priority !== 'chroniony' &&
      priority !== 'naturalne' &&
      touchesAreas([d.centre, ...cellPts], forbidden)
    ) {
      priority = 'chroniony';
      reasons.push('leży w strefie zakazu (prawdopodobne stanowisko), nie może być celem');
    }
    const [lat, lng] = fromEpsg2180(grid.originE + d.centre[0], grid.originN + d.centre[1]);
    const ring = cellPts.length >= 3 ? hullBuffer(cellPts, grid.cell / 2) : null;
    const outline = ring ? toWgs84([[[...ring, ring[0]!]]], grid.originE, grid.originN) : null;
    return {
      id: `${opts.sheetId}-${pad(k + 1)}`,
      sheetId: opts.sheetId,
      form: d.form,
      interpretation: d.interpretation,
      confidence: Math.round(d.confidence * 100) / 100,
      alternatives: d.alternatives.map((a) => ({
        ...a,
        confidence: Math.round(a.confidence * 100) / 100,
      })),
      priority,
      flags: d.flags,
      reasons,
      lat: Math.round(lat * 1e7) / 1e7,
      lng: Math.round(lng * 1e7) / 1e7,
      areaM2: Math.round(d.areaM2 * 10) / 10,
      lengthM: Math.round(d.lengthM * 10) / 10,
      widthM: Math.round(d.widthM * 10) / 10,
      reliefM: Math.round(d.reliefM * 100) / 100,
      score: score(d.reliefM, d.confidence, ctx, cfg),
      outline,
      searchZone:
        priority === 'chroniony' || priority === 'naturalne'
          ? null
          : toWgs84(withoutAreas(buildZoneLocal(d.zone), forbidden), grid.originE, grid.originN),
      exclusionZone: toWgs84(buildExclusionLocal(d.exclusion), grid.originE, grid.originN),
      decision: 'nowy',
      note: '',
    } satisfies Candidate;
  });
}

/** Whole analysis of one sheet. */
export function analyseSheet(
  grid: DemGrid,
  opts: AnalyseOptions,
  cfg = interpretConfig,
): Candidate[] {
  opts.onProgress?.(0.05, 'Relief lokalny');
  const scene = buildScene(grid, opts.exclude, cfg);
  opts.onProgress?.(0.35, 'Rozpoznawanie form');
  const margin = Math.max(cfg.score.waterBonusDistanceM, cfg.groups.campWaterM) + 50;
  const box = [-margin, -grid.h * grid.cell - margin, grid.w * grid.cell + margin, margin] as const;
  const extraWater = (opts.water ?? []).flatMap((g) => samplePoints(toLocalGeometry(g, grid), box));
  const detections = detectForms(scene, { water: extraWater }, cfg);
  opts.onProgress?.(0.85, 'Strefy poszukiwań');
  const waterLocal = [
    ...extraWater,
    ...detections
      .filter((d) => d.reasons.some((r) => r.includes('cieku')))
      .flatMap((d) =>
        d.cells
          .filter((_, i) => i % 7 === 0)
          .map((i): XY => [
            ((i % grid.w) + 0.5) * grid.cell,
            -(((i / grid.w) | 0) + 0.5) * grid.cell,
          ]),
      ),
  ];
  const out = toCandidates(grid, detections, opts, waterLocal, cfg);
  opts.onProgress?.(1, 'Gotowe');
  return out;
}
