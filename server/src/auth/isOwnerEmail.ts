import type { Env } from '../env';

/** The owner's addresses (secret ADMIN_EMAILS, comma-separated): the panel, and no invitation needed. */
export function isOwnerEmail(email: string, env: Env): boolean {
  return (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .some((e) => e && e === email.toLowerCase());
}
