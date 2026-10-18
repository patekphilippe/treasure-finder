import type { Interpretation } from '@/shared/types/domain';
import type { Entrance } from './features/entrance';
import type { LineFeatures } from './features/lines';
import type { Profile, Spoil } from './features/pit';
import type { RingShape } from './features/ringShape';
import { interpretConfig } from './interpretConfig';
import type { Shape } from './measure';
import { m, pct, side, towards } from './text';

export interface InterpretationOption {
  interpretation: Interpretation;
  /** 0–1 */
  confidence: number;
  reasons: string[];
}

const within = (v: number, [a, b]: readonly [number, number]) => v >= a && v <= b;
const opt = (
  interpretation: Interpretation,
  confidence: number,
  reasons: string[],
): InterpretationOption => ({
  interpretation,
  confidence: Math.max(0, Math.min(1, confidence)),
  reasons,
});
export const byConfidence = (a: InterpretationOption, b: InterpretationOption) =>
  b.confidence - a.confidence;

export interface PitInput {
  shape: Shape;
  spoil: Spoil;
  profile: Profile;
  entrance: Entrance;
}

/** A compact concave form. */
export function pitOptions(
  { shape, spoil, profile, entrance }: PitInput,
  cfg = interpretConfig,
): InterpretationOption[] {
  const S = cfg.sizes;
  const d = shape.equivalentDiameterM;
  const depth = profile.maxM || Math.abs(shape.reliefM);
  const out: InterpretationOption[] = [];
  const size = `${m(shape.lengthM)} × ${m(shape.widthM)}, głębokość ${m(depth)}`;

  // crater: rim all round, conical bottom
  if (within(d, S.craterM) && spoil.completeness >= cfg.spoil.craterCompleteness) {
    const cone = profile.deepShare < cfg.profile.coneMax;
    out.push(
      opt('leje', 0.55 + (cone ? 0.2 : 0) + (shape.circularity > 0.7 ? 0.1 : 0), [
        `okrągły dół ${m(d)} z wałem dookoła (${Math.round(spoil.completeness * 8)} z 8 stron)`,
        ...(cone ? ['dno w kształcie stożka, jak po wybuchu'] : []),
      ]),
    );
  }

  // uprooted tree: one-sided mound touching the pit
  const oneSided = spoil.topPairShare >= cfg.spoil.windthrowMassShare && spoil.direction !== null;
  if (within(d, S.windthrowM) && oneSided && spoil.touching) {
    out.push(
      opt('wykrot', 0.65 + (spoil.completeness <= 0.25 ? 0.15 : 0), [
        `dół ${m(d)} z kopcem przylegającym tylko ${side(spoil.direction!)}`,
        'tak wygląda dół po wywróconym drzewie',
      ]),
    );
  }

  // a lone firing pit looks like a windthrow: only a regular line of them makes firing positions
  // (group rule); alone it stays an alternative, below 'nieokreslona'
  if (within(d, S.firingPitM) && oneSided) {
    out.push(
      opt('stanowiska_strzeleckie', 0.15, [`mały dół ${m(d)} z hałdą ${side(spoil.direction!)}`]),
    );
  }

  // dugout: rectangle, flat bottom, maybe an entrance
  const rectangular = shape.rectangularity > 0.75;
  const flat = profile.deepShare > cfg.profile.flatBottomMin;
  if (rectangular && within(shape.lengthM, S.dugoutSideM) && within(shape.widthM, S.dugoutSideM)) {
    out.push(
      opt('ziemianka', 0.45 + (flat ? 0.2 : 0) + (entrance.found ? 0.25 : 0), [
        `prostokątny dół ${size}`,
        ...(flat ? ['płaskie dno'] : []),
        ...(entrance.found && entrance.direction !== null
          ? [`wąskie wcięcie wejścia ${side(entrance.direction)}`]
          : []),
      ]),
    );
  }

  // big irregular pit with spoil: a pit / quarry
  if (
    d >= S.pitM[0] &&
    (shape.circularity < 0.6 || shape.rectangularity < 0.6) &&
    spoil.completeness > 0
  ) {
    out.push(opt('wyrobisko', 0.5, [`nieregularny dół ${m(d)} z hałdami dookoła`]));
  }

  // large smooth hollow: natural (sinkhole, hollow, slide)
  if (
    shape.areaM2 >= S.naturalMinAreaM2 &&
    depth / Math.max(1, d) < 0.05 &&
    spoil.completeness === 0
  ) {
    out.push(
      opt('naturalna_inna', 0.5, [`duże, łagodne obniżenie ${m(d, 0)} bez regularnych krawędzi`]),
    );
  }

  out.push(opt('nieokreslona', 0.2, [`dół ${size}`]));
  return out.sort(byConfidence);
}

export interface MoundInput {
  shape: Shape;
  profile: Profile;
  topRoughness: number;
  /** ground just outside still above the far surroundings (share of the height): broad swell */
  flankShare: number;
  cutM2: number;
  uphillDir: number | null;
}

/** A compact convex form: dome or platform. */
export function moundOptions(
  { shape, profile, topRoughness, flankShare, cutM2, uphillDir }: MoundInput,
  cfg = interpretConfig,
): InterpretationOption[] {
  const S = cfg.sizes;
  const d = shape.equivalentDiameterM;
  const height = profile.maxM || shape.reliefM;
  const flatTop = topRoughness <= cfg.profile.flatTopRmsMax;
  const out: InterpretationOption[] = [];

  const barrowShape =
    height >= Math.max(S.barrowMinHeightM, S.barrowMinHeightRatio * d) &&
    shape.circularity >= S.barrowMinCircularity &&
    flankShare <= S.barrowMaxFlankShare;
  if (within(d, S.barrowM) && barrowShape && !flatTop) {
    out.push(
      opt('kurhan', 0.6 + (shape.circularity > 0.8 ? 0.15 : 0) + (height >= 0.8 ? 0.1 : 0), [
        `okrągła kopuła ${m(d)}, wysokość ${m(height)}`,
        'zaokrąglony wierzch',
      ]),
    );
  }
  if (within(d, S.charcoalKilnM) && flatTop && shape.circularity >= S.charcoalKilnMinCircularity) {
    out.push(
      opt('mielerz', 0.55 + (cutM2 > 2 ? 0.25 : 0) + (shape.circularity > 0.8 ? 0.1 : 0), [
        `płaska okrągła platforma ${m(d)}`,
        ...(cutM2 > 2 && uphillDir !== null ? [`wcięta w stok od góry (${side(uphillDir)})`] : []),
      ]),
    );
  }
  out.push(opt('nieokreslona', 0.2, [`wzniesienie ${m(d)}, wysokość ${m(height)}`]));
  return out.sort(byConfidence);
}

export interface LineInput {
  line: LineFeatures;
  /** another line runs alongside within 20 m */
  parallel: number;
  water: boolean;
}

/** A linear concave form. */
export function lineOptions(
  { line: f, parallel, water }: LineInput,
  cfg = interpretConfig,
): InterpretationOption[] {
  const L = cfg.lines;
  const S = cfg.sizes;
  const out: InterpretationOption[] = [];

  if (water) {
    out.push(
      opt('naturalna_inna', 0.7, [
        `szerokie obniżenie ${m(f.widthM, 0)} na długości ${m(f.lengthM, 0)}`,
        'prawdopodobnie dolina cieku',
      ]),
    );
    return out;
  }

  const zigzag = f.zigzagPer10m >= L.zigzagPer10mMin;
  const parapet = f.parapetSide !== 0 && f.parapetDir !== null;
  if (within(f.widthM, S.trenchWidthM) && (zigzag || parapet)) {
    // a parapet alone (straight ditch, bank on one side) is usually a roadside ditch
    out.push(
      opt('okop', zigzag ? 0.6 + (parapet ? 0.25 : 0) : 0.15, [
        `rów szerokości ${m(f.widthM)} na długości ${m(f.lengthM, 0)}`,
        ...(zigzag ? [`zygzak: ${f.turns.length} zmian kierunku na ${m(f.lengthM, 0)}`] : []),
        ...(parapet ? [`wał przedpiersia tylko ${side(f.parapetDir!)}`] : []),
      ]),
    );
  }

  const oblique = f.angleToSlopeDeg >= L.obliqueMinDeg && f.angleToSlopeDeg <= L.obliqueMaxDeg;
  if (within(f.widthM, S.roadWidthM) && f.uShare >= L.uProfileMin && (oblique || parallel > 0)) {
    out.push(
      opt('dawna_droga', 0.45 + (oblique ? 0.15 : 0) + (parallel > 0 ? 0.25 : 0), [
        `wcięcie szerokości ${m(f.widthM)} o płaskim dnie (profil U)`,
        ...(oblique ? [`biegnie ukośnie do spadku stoku (${Math.round(f.angleToSlopeDeg)}°)`] : []),
        ...(parallel > 0 ? [`wiązka: ${parallel + 1} równoległe wcięcia w pasie 20 m`] : []),
      ]),
    );
  }

  const straight = f.tortuosity < L.straightTortuosityMax;
  const steadyFall = f.monotonicShare >= L.monotonicShareMin && f.gradient >= L.minGradient;
  if (straight && steadyFall && !zigzag) {
    out.push(
      opt('row_melioracyjny_graniczny', 0.6 + (f.monotonicShare > 0.95 ? 0.15 : 0), [
        'prosty rów bez zakrętów',
        `stały spadek ${pct(f.gradient)} w jedną stronę`,
      ]),
    );
  }

  out.push(opt('nieokreslona', 0.2, [`liniowe wcięcie ${m(f.widthM)} × ${m(f.lengthM, 0)}`]));
  return out.sort(byConfidence);
}

/** A wall around an inner area: hillfort ring or equipment horseshoe. */
export function ringOptions(
  shape: Shape,
  ring: RingShape,
  cfg = interpretConfig,
): InterpretationOption[] {
  const S = cfg.sizes;
  const d = shape.lengthM;
  const out: InterpretationOption[] = [];
  // calibration: irregular blobs looked like horseshoes; a real wall stands above its inside
  const realWall =
    ring.wallAboveInnerM >= cfg.ring.wallAboveInnerM && shape.reliefM >= cfg.ring.wallMinHeightM;
  if (!realWall) return [opt('nieokreslona', 0.2, [`nieregularne wzniesienie ${m(d)}`])];
  const closed = ring.coveredSectors >= cfg.ring.closedSectors || shape.holes > 0;
  const roundness = (ring.hullAreaM2 ?? 0) / (Math.PI * (d / 2) ** 2);
  if (
    (closed || ring.coveredSectors >= 7) &&
    d >= S.hillfortM[0] &&
    d <= S.hillfortM[1] &&
    ring.innerShare >= cfg.ring.hillfortInnerShareMin &&
    roundness >= cfg.ring.hillfortRoundnessMin
  ) {
    out.push(
      opt('grodzisko_waly', closed ? 0.75 : 0.6, [
        `${closed ? 'zamknięty' : 'prawie zamknięty'} wał pierścieniowy ${m(d, 0)}`,
      ]),
    );
  }
  if (
    !closed &&
    ring.coveredSectors >= cfg.ring.horseshoeSectorsMin &&
    within(d, S.horseshoeM) &&
    ring.openingDir !== null
  ) {
    out.push(
      opt('stanowisko_sprzetu', 0.7, [
        `wał w kształcie podkowy ${m(d)}, otwarty na ${towards(ring.openingDir)}`,
      ]),
    );
  }
  out.push(opt('nieokreslona', 0.2, [`wał wokół zagłębienia ${m(d)}`]));
  return out.sort(byConfidence);
}
