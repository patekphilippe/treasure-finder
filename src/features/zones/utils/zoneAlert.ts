import type { Zone } from '@/shared/types/domain';
import { isPermitValid } from './isPermitValid';
import type { Membership } from './updateMembership';

export type ZoneAlert =
  { kind: 'zakaz'; zone: Zone } | { kind: 'zgoda_wygasla'; zone: Zone } | { kind: 'poza_zgoda' };

/**
 * Forbidden zone first; then, if any permit zones exist, being outside all of them
 * (or only inside expired ones) is an alert too.
 */
export function zoneAlert(
  membership: Membership,
  zones: readonly Zone[],
  now: number,
): ZoneAlert | null {
  const inside = zones.filter((z) => membership[z.id]);
  const forbidden = inside.find((z) => z.kind === 'zakaz');
  if (forbidden) return { kind: 'zakaz', zone: forbidden };
  if (!zones.some((z) => z.kind === 'zgoda')) return null;
  const permits = inside.filter((z) => z.kind === 'zgoda');
  if (permits.some((z) => isPermitValid(z, now))) return null;
  return permits[0] ? { kind: 'zgoda_wygasla', zone: permits[0] } : { kind: 'poza_zgoda' };
}

export function sameAlert(a: ZoneAlert | null, b: ZoneAlert | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && ('zone' in a ? a.zone.id : '') === ('zone' in b ? b.zone.id : '');
}
