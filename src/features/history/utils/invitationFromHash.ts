import { cleanEmail } from '@/shared/lib/cleanEmail';

/**
 * Invitation link → the invited address, as a hint for signing in: `#zaproszenie=<adres>` gives
 * the address, `#zaproszenie` and the old `#dolacz=<kod>` links give ''; anything else null.
 */
export function invitationFromHash(hash: string): string | null {
  const m = /^#zaproszenie(?:=(.*))?$/.exec(hash);
  if (!m) return /^#dolacz=/.test(hash) ? '' : null;
  try {
    return cleanEmail(decodeURIComponent(m[1] ?? '')) ?? '';
  } catch {
    return '';
  }
}
