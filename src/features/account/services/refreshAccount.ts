import { memberAuth } from '@/shared/auth/memberAuth';
import { BACKEND_URL } from '@/shared/config/backend';
import { useMembership } from '@/shared/store/useMembership';
import type { Member } from '@/shared/types/community';

/**
 * Asks the backend again who the signed-in member is (name, admin) and remembers it; quiet when
 * offline. Sessions from before the admin flag learn it here.
 */
export async function refreshAccount(): Promise<void> {
  if (!useMembership.getState().email) return;
  const res = await fetch(`${BACKEND_URL}/api/community/me`, { headers: await memberAuth() });
  if (!res.ok) return;
  const me = (await res.json()) as Member;
  useMembership.getState().join(me.email ?? '', me.name, me.owner);
}
