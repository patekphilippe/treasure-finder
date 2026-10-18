import type {
  AlternativeInterpretation,
  CandidateFlags,
  FormKind,
  Interpretation,
  Priority,
} from '@/shared/types/domain';
import type { Component } from './components';
import { entrance } from './features/entrance';
import { fieldStripWindows, groupWindows, windowCentre } from './features/fieldStrips';
import {
  centroid,
  circularMean,
  circularVariance,
  clusters,
  linearity,
  nearestNeighbourStats,
} from './features/groups';
import { lineFeatures, toLocal, type LineFeatures, type XY } from './features/lines';
import { topRoughness, uphill, uphillCutM2 } from './features/mound';
import { profileAgainstSurroundings, spoilAround, type Spoil } from './features/pit';
import { ringShape, type RingShape } from './features/ringShape';
import { distanceToWater, isWaterLine } from './features/water';
import { angleDiff, distanceToCells, windowAround } from './geom';
import { interpretConfig } from './interpretConfig';
import {
  byConfidence,
  lineOptions,
  moundOptions,
  pitOptions,
  ringOptions,
  type InterpretationOption,
} from './interpretSingle';
import { measure, type Shape } from './measure';
import { sceneComponents, type Scene } from './scene';
import { m, side } from './text';
import { FLAGS, INTERPRETATIONS } from './vocabulary';
import type { ExclusionSpec, ZoneSpec } from './zoneSpec';

/** One interpreted form, in local metres of the sheet (x east, y north from the top-left). */
export interface Detection {
  form: FormKind;
  interpretation: Interpretation;
  confidence: number;
  alternatives: AlternativeInterpretation[];
  priority: Priority;
  flags: CandidateFlags;
  reasons: string[];
  centre: XY;
  /** member cells (sheet indices) */
  cells: number[];
  areaM2: number;
  lengthM: number;
  widthM: number;
  reliefM: number;
  zone: ZoneSpec;
  exclusion: ExclusionSpec;
}

interface Item {
  kind: 'pit' | 'mound' | 'line' | 'ring' | 'group' | 'strips';
  form: FormKind;
  options: InterpretationOption[];
  cells: number[];
  centre: XY;
  shape: Shape;
  extra: string[];
  priority?: Priority;
  spoil?: Spoil;
  line?: LineFeatures;
  ring?: RingShape;
  /** for groups: member centres and spoil directions */
  members?: XY[];
  spoilDir?: number;
  waterAt?: XY | null;
  squares?: { x0: number; y0: number; size: number }[];
  consumed?: boolean;
}

export interface DetectOptions {
  /** extra water (e.g. imported BDOT10k rivers), local metres, sampled every few metres */
  water?: XY[];
}

const cellsOf = (c: Component) => Array.from(c.cells);
const centreOf = (s: Scene, shape: Shape): XY => [
  (shape.col + 0.5) * s.cell,
  -(shape.row + 0.5) * s.cell,
];

/** Adjacent components of the other sign, edge to edge within `adjM`. */
function adjacency(s: Scene, a: Component, labelsB: Int32Array, adjM: number): Set<number> {
  const win = windowAround(a, s.w, s.h, Math.ceil(adjM / s.cell) + 1);
  const d = distanceToCells(a.cells, s.w, win);
  const out = new Set<number>();
  for (let y = 0; y < win.rows; y++)
    for (let x = 0; x < win.cols; x++) {
      const dm = d[y * win.cols + x]! * s.cell;
      if (dm <= 0 || dm - s.cell > adjM) continue;
      const l = labelsB[(y + win.row0) * s.w + x + win.col0]!;
      if (l) out.add(l - 1);
    }
  return out;
}

function label(s: Scene, comps: Component[]): Int32Array {
  const l = new Int32Array(s.w * s.h);
  comps.forEach((c, k) => c.cells.forEach((i) => (l[i] = k + 1)));
  return l;
}

/** Detects and interprets all forms of a sheet. */
export function detectForms(
  s: Scene,
  opts: DetectOptions = {},
  cfg = interpretConfig,
): Detection[] {
  const C = cfg;
  const concave = sceneComponents(s, s.concave, cfg);
  const convex = sceneComponents(s, s.convex, cfg);
  const shapes = (cs: Component[]) =>
    cs.map((c) => measure(c, s.lrm, s.w, s.cell, C.masks.minHoleM2, C.masks.ringClosingCells));
  const concaveShapes = shapes(concave);
  const convexShapes = shapes(convex);
  const convexLabels = label(s, convex);
  const usedConvex = new Set<number>();
  const usedConcave = new Set<number>();

  // pair forms: small concave beside a big mound = a cut into the slope; small convex next to a
  // pit = its spoil. A pit inside a wall (crater rim, ring) is never a cut of that wall.
  concave.forEach((c, k) => {
    for (const j of adjacency(s, c, convexLabels, C.spoil.adjacencyM)) {
      const big = convexShapes[j]!;
      const own = concaveShapes[k]!;
      const inside =
        big.holes > 0 ||
        Math.hypot(own.row - big.row, own.col - big.col) * s.cell < big.equivalentDiameterM / 2;
      if (
        !inside &&
        big.areaM2 >= 30 &&
        big.elongation < C.lines.elongationMin &&
        own.areaM2 <= C.spoil.cutAreaRatioMax * big.areaM2
      )
        usedConcave.add(k);
    }
  });
  concave.forEach((c, k) => {
    if (usedConcave.has(k)) return;
    for (const j of adjacency(s, c, convexLabels, C.spoil.adjacencyM))
      if (convexShapes[j]!.areaM2 <= C.spoil.spoilAreaRatioMax * concaveShapes[k]!.areaM2)
        usedConvex.add(j);
  });

  const items: Item[] = [];
  const water: XY[] = [...(opts.water ?? [])];

  concave.forEach((c, k) => {
    if (usedConcave.has(k)) return;
    const shape = concaveShapes[k]!;
    const centre = centreOf(s, shape);
    if (shape.elongation >= C.lines.elongationMin) {
      const line = lineFeatures(s, c, cfg);
      if (isWaterLine(line, cfg)) water.push(...line.axis);
      items.push({
        kind: 'line',
        form: 'linia',
        options: [],
        cells: cellsOf(c),
        centre,
        shape,
        extra: [],
        line,
      });
      return;
    }
    const spoil = spoilAround(s, c, shape.row, shape.col, cfg);
    const profile = profileAgainstSurroundings(s, c, -1, cfg);
    const ent = entrance(c, s.w, s.cell, cfg);
    items.push({
      kind: 'pit',
      form: 'pojedynczy_dol',
      options: pitOptions({ shape, spoil, profile, entrance: ent }, cfg),
      cells: cellsOf(c),
      centre,
      shape,
      extra: [],
      spoil,
    });
  });

  convex.forEach((c, k) => {
    if (usedConvex.has(k)) return;
    const shape = convexShapes[k]!;
    const centre = centreOf(s, shape);
    const ring = ringShape(c, s.w, cfg);
    if (
      ring.innerShare >= C.ring.innerShareMin &&
      ring.coveredSectors >= C.ring.horseshoeSectorsMin
    ) {
      const options = ringOptions(shape, ring, cfg);
      const closed = ring.coveredSectors >= C.ring.closedSectors || shape.holes > 0;
      items.push({
        kind: 'ring',
        form: closed ? 'pierscien' : 'podkowa',
        options,
        cells: cellsOf(c),
        centre,
        shape,
        extra: [],
        ring,
      });
      return;
    }
    if (shape.elongation >= C.lines.elongationMin) {
      items.push({
        kind: 'mound',
        form: 'linia',
        options: [
          {
            interpretation: 'nieokreslona',
            confidence: 0.2,
            reasons: [`wał ${m(shape.widthM)} × ${m(shape.lengthM, 0)}`],
          },
        ],
        cells: cellsOf(c),
        centre,
        shape,
        extra: [],
      });
      return;
    }
    const profile = profileAgainstSurroundings(s, c, 1, cfg);
    const rough = profile.plane ? topRoughness(s, c, profile.plane, profile.maxM) : 1;
    const up = profile.plane ? uphill(profile.plane) : null;
    const cut = uphillCutM2(s, c, shape.row, shape.col, up, cfg);
    items.push({
      kind: 'mound',
      form: rough <= C.profile.flatTopRmsMax ? 'platforma' : 'pojedynczy_kopiec',
      options: moundOptions(
        { shape, profile, topRoughness: rough, cutM2: cut, uphillDir: up },
        cfg,
      ),
      cells: cellsOf(c),
      centre,
      shape,
      extra: [],
    });
  });

  // lines: parallel bundles, then interpretation
  const lines = items.filter((it) => it.kind === 'line');
  for (const it of lines) {
    const f = it.line!;
    const isWater = isWaterLine(f, cfg);
    const parallel = isWater
      ? 0
      : lines.filter((o) => {
          if (o === it || isWaterLine(o.line!, cfg)) return false;
          if (
            (angleDiff(o.shape.axis, it.shape.axis) * 180) / Math.PI > 15 &&
            (angleDiff(o.shape.axis + Math.PI, it.shape.axis) * 180) / Math.PI > 15
          )
            return false;
          const dx = o.centre[0] - it.centre[0];
          const dy = o.centre[1] - it.centre[1];
          const across = Math.abs(-dx * Math.sin(it.shape.axis) + dy * Math.cos(it.shape.axis));
          const along = Math.abs(dx * Math.cos(it.shape.axis) + dy * Math.sin(it.shape.axis));
          return (
            across <= C.lines.parallelBandM && along <= (it.line!.lengthM + o.line!.lengthM) / 2
          );
        }).length;
    it.options = lineOptions({ line: f, parallel, water: isWater }, cfg);
  }

  groupFiringPositions(items, cfg);
  groupCamps(items, water, cfg);
  groupSettlements(items, cfg);
  markBarrowCemeteries(items, cfg);
  noteWindthrowDensity(items);
  addFieldStrips(s, items, cfg);

  return items.filter((it) => !it.consumed).map((it) => finalize(s, it, water, cfg));
}

const top = (it: Item) => it.options[0]?.interpretation;
const has = (it: Item, i: Interpretation, min = 0.25) =>
  it.options.some((o) => o.interpretation === i && o.confidence >= min);

function groupFiringPositions(items: Item[], cfg: typeof interpretConfig) {
  const G = cfg.groups;
  const pits = items.filter(
    (it) =>
      it.kind === 'pit' &&
      !it.consumed &&
      it.spoil?.direction != null &&
      has(it, 'stanowiska_strzeleckie', 0.2),
  );
  for (const idx of clusters(
    pits.map((p) => p.centre),
    G.firingSpacingToM,
  )) {
    if (idx.length < G.firingMin) continue;
    const ms = idx.map((k) => pits[k]!);
    const pts = ms.map((p) => p.centre);
    const nn = nearestNeighbourStats(pts);
    const lin = linearity(pts);
    const dirs = ms.map((p) => p.spoil!.direction!);
    const cv = circularVariance(dirs);
    if (nn.mean < G.firingSpacingFromM || nn.mean > G.firingSpacingToM || nn.cv >= G.regularCvMax)
      continue;
    if (lin.ratio >= G.linearityMax || cv >= G.spoilCircularVarianceMax) continue;
    const dir = circularMean(dirs);
    const sd = nn.cv * nn.mean;
    ms.forEach((p) => (p.consumed = true));
    items.push({
      kind: 'group',
      form: 'skupisko',
      options: [
        {
          interpretation: 'stanowiska_strzeleckie',
          confidence: Math.min(0.95, 0.6 + (0.35 - nn.cv) + (0.3 - cv)),
          reasons: [
            `${ms.length} dołów w linii co ${m(nn.mean)} ± ${m(sd)}`,
            `hałda przy każdym dole ${side(dir)}`,
          ],
        },
        { interpretation: 'wykrot', confidence: 0.15, reasons: [] },
      ],
      cells: ms.flatMap((p) => p.cells),
      centre: centroid(pts),
      shape: ms[0]!.shape,
      extra: [],
      members: pts,
      spoilDir: dir,
    });
  }
}

function groupCamps(items: Item[], water: XY[], cfg: typeof interpretConfig) {
  const G = cfg.groups;
  const dugouts = items.filter(
    (it) => it.kind === 'pit' && !it.consumed && top(it) === 'ziemianka',
  );
  for (const idx of clusters(
    dugouts.map((p) => p.centre),
    G.campRadiusM,
  )) {
    const ms = idx.map((k) => dugouts[k]!);
    if (ms.length < G.campMin) continue;
    const c = centroid(ms.map((p) => p.centre));
    const radius = Math.max(...ms.map((p) => Math.hypot(p.centre[0] - c[0], p.centre[1] - c[1])));
    if (radius > G.campRadiusM) continue;
    const areas = ms.map((p) => p.shape.areaM2);
    const mean = areas.reduce((a, b) => a + b, 0) / areas.length;
    const cvA = Math.sqrt(areas.reduce((a, b) => a + (b - mean) ** 2, 0) / areas.length) / mean;
    if (cvA >= G.campAreaCvMax) continue;
    const w = distanceToWater(c, water);
    const nearWater = w.d <= G.campWaterM;
    ms.forEach((p) => (p.consumed = true));
    items.push({
      kind: 'group',
      form: 'skupisko',
      options: [
        {
          interpretation: 'oboz',
          confidence: nearWater ? 0.8 : 0.6,
          reasons: [
            `${ms.length} prostokątne ziemianki o podobnych wymiarach w promieniu ${m(radius, 0)}`,
            nearWater ? `ciek lub podmokłe obniżenie ${m(w.d, 0)} dalej` : 'brak wody w pobliżu',
          ],
        },
        { interpretation: 'zaginiona_osada', confidence: 0.35, reasons: [] },
        { interpretation: 'ziemianka', confidence: 0.3, reasons: [] },
      ],
      cells: ms.flatMap((p) => p.cells),
      centre: c,
      shape: ms[0]!.shape,
      extra: [],
      priority: nearWater ? undefined : 'wysoki',
      waterAt: nearWater ? w.nearest : null,
    });
  }
}

function groupSettlements(items: Item[], cfg: typeof interpretConfig) {
  const G = cfg.groups;
  const S = cfg.sizes;
  const natural = (it: Item) => INTERPRETATIONS[top(it)!].priority === 'naturalne';
  // small pits of a few cells always look rectangular on a 1 m grid: only house-sized features
  // (4–15 m) make a settlement; cellars (2–4 m) only add to it
  const rect = items.filter(
    (it) =>
      !it.consumed &&
      !natural(it) &&
      (it.kind === 'pit' || it.form === 'platforma') &&
      it.shape.rectangularity > 0.75 &&
      it.shape.lengthM >= S.cellarM[0] &&
      it.shape.lengthM <= S.settlementFeatureM[1],
  );
  const houseSized = (it: Item) => it.shape.lengthM >= S.settlementFeatureM[0];
  for (const idx of clusters(
    rect.map((p) => p.centre),
    G.settlementRadiusM / 2,
  )) {
    const ms = idx.map((k) => rect[k]!);
    const houses = ms.filter(houseSized).length;
    if (ms.length < G.settlementMin || houses < 2) continue;
    const cellars = ms.length - houses;
    ms.forEach((p) => (p.consumed = true));
    items.push({
      kind: 'group',
      form: 'skupisko',
      options: [
        {
          interpretation: 'zaginiona_osada',
          confidence: 0.55 + (cellars > 0 ? 0.15 : 0),
          reasons: [
            `${houses} prostokątne zagłębienia lub platformy wielkości budynku w jednym miejscu`,
            ...(cellars ? [`${cellars} małe zagłębienia jak piwniczki`] : []),
          ],
        },
        { interpretation: 'oboz', confidence: 0.3, reasons: [] },
      ],
      cells: ms.flatMap((p) => p.cells),
      centre: centroid(ms.map((p) => p.centre)),
      shape: ms[0]!.shape,
      extra: [],
    });
  }
}

function markBarrowCemeteries(items: Item[], cfg: typeof interpretConfig) {
  const G = cfg.groups;
  const barrows = items.filter((it) => !it.consumed && top(it) === 'kurhan');
  for (const b of barrows) {
    const n = barrows.filter(
      (o) =>
        Math.hypot(o.centre[0] - b.centre[0], o.centre[1] - b.centre[1]) <= G.barrowCemeteryRadiusM,
    ).length;
    if (n >= G.barrowCemeteryMin)
      b.extra.push(
        `cmentarzysko kurhanowe: ${n} kopuły w promieniu ${m(G.barrowCemeteryRadiusM, 0)}`,
      );
  }
}

function noteWindthrowDensity(items: Item[]) {
  const w = items.filter((it) => !it.consumed && top(it) === 'wykrot');
  if (w.length >= 10)
    for (const it of w)
      it.extra.push(
        `w okolicy ${w.length} podobnych dołów z kopcem, typowe dla lasu po wiatrołomie`,
      );
}

function addFieldStrips(s: Scene, items: Item[], cfg: typeof interpretConfig) {
  const settlements = items.filter((it) => !it.consumed && top(it) === 'zaginiona_osada');
  for (const g of groupWindows(fieldStripWindows(s, cfg))) {
    const centre = centroid(g.map(windowCentre));
    const period = g.reduce((a, w) => a + w.periodM, 0) / g.length;
    const peak = g.reduce((a, w) => a + w.peak, 0) / g.length;
    const near = settlements.some(
      (o) =>
        Math.hypot(o.centre[0] - centre[0], o.centre[1] - centre[1]) <=
        cfg.score.fieldsNearSettlementM,
    );
    items.push({
      kind: 'strips',
      form: 'uklad_rownolegly',
      options: [
        {
          interpretation: 'pola_dawne',
          confidence: Math.min(0.9, 0.45 + peak / 2),
          reasons: [`równoległe garby co ${m(period, 0)} na ${g.length} polach 50 × 50 m`],
        },
      ],
      cells: [],
      centre,
      shape: {
        row: 0,
        col: 0,
        areaM2: 0,
        perimeterM: 0,
        lengthM: 0,
        widthM: 0,
        axis: 0,
        reliefM: 0.1,
        circularity: 0,
        elongation: 1,
        rectangularity: 0,
        holes: 0,
        equivalentDiameterM: 0,
      },
      extra: near ? ['blisko zaginionej osady'] : [],
      priority: near ? 'wysoki' : undefined,
      squares: g.map((w) => ({ x0: w.x0, y0: w.y0, size: w.size })),
    });
  }
}

function finalize(s: Scene, it: Item, water: XY[], cfg: typeof interpretConfig): Detection {
  const options = [...it.options].sort(byConfidence);
  const best = options[0]!;
  const interpretation = best.interpretation;
  const alternatives = options
    .slice(1)
    .filter((o) => o.interpretation !== interpretation)
    .slice(0, 2)
    .map((o) => ({ interpretation: o.interpretation, confidence: o.confidence }));
  const points = it.cells.map((i) => toLocal(s, i));
  const { zone, exclusion } = zoneFor(s, it, interpretation, points, water, cfg);
  return {
    form: it.form,
    interpretation,
    confidence: best.confidence,
    alternatives,
    priority: it.priority ?? INTERPRETATIONS[interpretation].priority,
    flags: FLAGS[interpretation],
    reasons: [...best.reasons, ...it.extra],
    centre: it.centre,
    cells: it.cells,
    areaM2:
      it.kind === 'strips'
        ? it.squares!.length * cfg.fieldStrips.windowM ** 2
        : it.cells.length * s.cell * s.cell,
    lengthM: it.line?.lengthM ?? it.shape.lengthM,
    widthM: it.line?.widthM ?? it.shape.widthM,
    reliefM: it.shape.reliefM,
    zone,
    exclusion,
  };
}

function zoneFor(
  s: Scene,
  it: Item,
  interp: Interpretation,
  points: XY[],
  water: XY[],
  cfg: typeof interpretConfig,
): { zone: ZoneSpec; exclusion: ExclusionSpec } {
  const Z = cfg.zones;
  const none: ZoneSpec = { kind: 'none' };
  switch (interp) {
    case 'kurhan':
      return { zone: none, exclusion: { points, bufferM: Z.barrowExclusionM } };
    case 'grodzisko_waly':
      return { zone: none, exclusion: { points, bufferM: Z.hillfortExclusionM } };
    case 'wykrot':
    case 'naturalna_inna':
    case 'row_melioracyjny_graniczny':
      return { zone: none, exclusion: null };
    case 'zaginiona_osada':
      return { zone: { kind: 'hull', points, bufferM: Z.settlementBufferM }, exclusion: null };
    case 'oboz':
      return {
        zone: {
          kind: 'hull',
          points,
          bufferM: Z.campBufferM,
          ...(it.waterAt ? { corridorTo: it.waterAt, corridorWidthM: Z.campCorridorWidthM } : {}),
        },
        exclusion: null,
      };
    case 'ziemianka':
      return { zone: { kind: 'hull', points, bufferM: Z.dugoutBufferM }, exclusion: null };
    case 'okop': {
      const f = it.line!;
      // circles at real bends and junctions; zigzag teeth would cover both sides
      const circles = [...f.majorTurns, ...f.junctions];
      return {
        zone: f.parapetSide
          ? {
              kind: 'oneSide',
              axis: f.axis,
              side: -f.parapetSide,
              fromM: Z.trenchStripFromM + f.widthM / 2,
              toM: Z.trenchStripToM + f.widthM / 2,
              circles,
              circleM: Z.trenchCircleM,
            }
          : {
              kind: 'bothSides',
              axis: f.axis,
              bufferM: Z.trenchStripToM,
              circles,
              circleM: Z.trenchCircleM,
            },
        exclusion: null,
      };
    }
    case 'stanowiska_strzeleckie':
      return {
        zone: {
          kind: 'circles',
          centres: it.members ?? [it.centre],
          radiusM: Z.firingBufferM,
          shiftDir: (it.spoilDir ?? 0) + Math.PI,
          shiftM: Z.firingShiftM,
        },
        exclusion: null,
      };
    case 'stanowisko_sprzetu': {
      // inside of the horseshoe + a 10 m circle in front of the opening
      const r = it.ring!;
      const inner: XY = [(r.col + 0.5) * s.cell, -(r.row + 0.5) * s.cell];
      const dir = r.openingDir ?? 0;
      const reach = it.shape.lengthM / 2;
      const open: XY = [inner[0] + Math.cos(dir) * reach, inner[1] + Math.sin(dir) * reach];
      const ringPts: XY[] = Array.from({ length: Z.circleSegments }, (_, k) => {
        const a = (2 * Math.PI * k) / Z.circleSegments;
        return [open[0] + Z.horseshoeOpenM * Math.cos(a), open[1] + Z.horseshoeOpenM * Math.sin(a)];
      });
      return {
        zone: { kind: 'hull', points: [...points, ...ringPts], bufferM: 0 },
        exclusion: null,
      };
    }
    case 'dawna_droga': {
      const f = it.line!;
      const fords = f.axis.filter((p) => distanceToWater(p, water).d <= 10);
      const circles = [
        ...f.junctions,
        ...(fords.length ? [fords[Math.floor(fords.length / 2)]!] : []),
      ];
      if (f.maxGradient > cfg.lines.steepRampGradient)
        circles.push(f.axis[Math.floor(f.axis.length / 2)]!);
      return {
        zone: {
          kind: 'bothSides',
          axis: f.axis,
          bufferM: Z.roadBufferM,
          circles,
          circleM: Z.roadCircleM,
        },
        exclusion: null,
      };
    }
    case 'pola_dawne':
      return { zone: { kind: 'squares', squares: it.squares ?? [] }, exclusion: null };
    default:
      return { zone: { kind: 'hull', points, bufferM: Z.smallBufferM }, exclusion: null };
  }
}
