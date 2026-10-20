import type { Env } from '../env';
import { verifyTurnstile } from '../submissions/verifyTurnstile';
import { memberFrom, type MemberRow } from './auth';

/**
 * A person, not a bot: either a community member (their invitation code is the proof) or a
 * passed Turnstile check. Returns the member when there is one, `false` when the check failed.
 */
export async function humanCheck(
  request: Request,
  env: Env,
  turnstileToken: string,
  ip: string,
  now: number,
): Promise<{ member: MemberRow | null } | false> {
  const member = await memberFrom(request, env, now);
  if (member) return { member };
  if (!turnstileToken) return false;
  return (await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET, ip))
    ? { member: null }
    : false;
}
