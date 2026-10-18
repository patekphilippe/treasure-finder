import type { Geometry } from 'geojson';
import type { ContextKind } from '@/shared/types/domain';
import type { XY } from './features/lines';
import { interpretConfig } from './interpretConfig';
import { distanceToGeometry } from './score';

/** An archival object in the same planar metres as the point it is measured from. */
export interface ArchivalFeature {
  geometry: Geometry;
  kind?: ContextKind;
}

export interface ArchivalNearest {
  distM: number;
  /** the range of this kind (closeness 0 beyond it) */
  radiusM: number;
  kind?: ContextKind;
}

const KIND_LABEL: Record<ContextKind, string> = {
  osada: 'dawna osada',
  droga: 'droga',
  mlyn: 'młyn',
  karczma: 'karczma',
  brod: 'bród',
  inne: 'obiekt',
};

/** Reason texts this module writes, so a re-score can replace them. */
export const ARCHIVAL_REASON = / z mapy archiwalnej \d+ m dalej$/;

/**
 * The archival object that lends the most context: the closest relative to its kind's range,
 * so a village 350 m away counts more than a ford 180 m away.
 */
export function archivalNearest(
  p: XY,
  features: readonly ArchivalFeature[],
  cfg = interpretConfig,
): ArchivalNearest {
  let best: ArchivalNearest = { distM: Infinity, radiusM: cfg.score.contextMaxDistanceM };
  let bestCloseness = -Infinity;
  for (const f of features) {
    const radiusM = f.kind ? cfg.score.contextKindRadiusM[f.kind] : cfg.score.contextMaxDistanceM;
    const distM = distanceToGeometry(p, f.geometry);
    const closeness = 1 - distM / radiusM;
    if (closeness > bestCloseness) {
      bestCloseness = closeness;
      best = { distM, radiusM, kind: f.kind };
    }
  }
  return best;
}

/** "młyn z mapy archiwalnej 120 m dalej", or null when the object is out of range. */
export function archivalReason(n: ArchivalNearest): string | null {
  if (n.distM > n.radiusM) return null;
  return `${KIND_LABEL[n.kind ?? 'inne']} z mapy archiwalnej ${Math.round(n.distM)} m dalej`;
}
