import type { Zone } from '@/shared/types/domain';

/** A permit zone without an expiry date counts as valid. */
export function isPermitValid(zone: Zone, now: number): boolean {
  return zone.kind === 'zgoda' && (zone.validUntil === undefined || zone.validUntil >= now);
}
