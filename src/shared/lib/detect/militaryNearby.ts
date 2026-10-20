import type { CandidateFlags } from '@/shared/types/domain';
import type { ArchivalFeature } from './archivalContext';
import type { XY } from './features/lines';
import { interpretConfig } from './interpretConfig';
import { distanceToGeometry } from './score';

export interface MilitaryNearby {
  /** positions, trenches or a grave from a military map in reach: unexploded ordnance likely */
  uxo: boolean;
  warGraves: boolean;
  /** a war grave right next to it: the candidate must never become a search target */
  protect: boolean;
  reasons: string[];
}

/** Reason texts this module writes, so a re-score can replace them. */
export const MILITARY_REASON = / z mapy wojskowej \d+ m dalej/;
/** ends the reason of protection by a war grave, the one protection a re-score may lift */
export const GRAVE_PROTECT_SUFFIX = 'nie może być celem';

/**
 * Safety from archival military objects around a point (same planar metres): the UXO and
 * war-graves warnings, and protection right next to a war grave. Never raises a score.
 */
export function militaryNearby(
  p: XY,
  features: readonly ArchivalFeature[],
  cfg = interpretConfig,
): MilitaryNearby {
  let positionM = Infinity;
  let graveM = Infinity;
  for (const f of features) {
    if (f.kind === 'wojsko') positionM = Math.min(positionM, distanceToGeometry(p, f.geometry));
    if (f.kind === 'grob_wojenny') graveM = Math.min(graveM, distanceToGeometry(p, f.geometry));
  }
  const near = cfg.score.contextKindRadiusM;
  const reasons: string[] = [];
  const grave = graveM <= near.grob_wojenny;
  const protect = graveM <= cfg.score.warGraveProtectM;
  if (grave)
    reasons.push(
      protect
        ? `mogiła wojenna z mapy wojskowej ${Math.round(graveM)} m dalej, ${GRAVE_PROTECT_SUFFIX}`
        : `mogiła wojenna z mapy wojskowej ${Math.round(graveM)} m dalej, zachowaj szacunek i odstęp`,
    );
  const positions = positionM <= near.wojsko;
  if (positions)
    reasons.push(
      `pozycje wojskowe z mapy wojskowej ${Math.round(positionM)} m dalej, ryzyko niewybuchów`,
    );
  return { uxo: positions || grave, warGraves: grave, protect, reasons };
}

/** The interpretation's own flags with the military warnings added. */
export function withMilitaryFlags(base: CandidateFlags, m: MilitaryNearby): CandidateFlags {
  return { uxo: base.uxo || m.uxo, warGraves: base.warGraves || m.warGraves };
}
