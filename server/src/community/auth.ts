import { isOwnerEmail } from '../auth/isOwnerEmail';
import { signedIn, type SignedIn } from '../auth/session';
import { randomToken, sha256Hex } from '../crypto';
import type { Env } from '../env';

export interface MemberRow {
  id: string;
  name: string;
  email: string | null;
  blocked: number;
  last_seen_day: string | null;
}

const SELECT = 'SELECT id, name, email, blocked, last_seen_day FROM members';

/** `token_hash` is left from the invitation codes (NOT NULL UNIQUE): a random hash nobody knows. */
export const unusedCodeHash = () => sha256Hex(randomToken(24));

/** The owner needs no invitation: their member row is made at the first sign-in. */
async function addOwner(env: Env, who: SignedIn, now: number): Promise<MemberRow | null> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO members (id, name, token_hash, blocked, created_at, email, auth_sub)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
  )
    .bind(randomToken(9), who.name || 'Właściciel', await unusedCodeHash(), now, who.email, who.sub)
    .run();
  return env.DB.prepare(`${SELECT} WHERE auth_sub = ?`).bind(who.sub).first<MemberRow>();
}

/**
 * The member behind the Auth0 sign-in, or null (not signed in, not invited, blocked). The
 * invitation is the e-mail address: the first sign-in with it ties the member to that account
 * (`auth_sub`), later sign-ins go by the account. Notes the day of the last visit.
 */
export async function memberFrom(
  request: Request,
  env: Env,
  now: number,
): Promise<MemberRow | null> {
  const who = await signedIn(request, env, now);
  if (!who) return null;
  let row = await env.DB.prepare(`${SELECT} WHERE auth_sub = ?`).bind(who.sub).first<MemberRow>();
  if (!row) {
    row = await env.DB.prepare(`${SELECT} WHERE email = ? AND auth_sub IS NULL`)
      .bind(who.email)
      .first<MemberRow>();
    if (row)
      await env.DB.prepare('UPDATE members SET auth_sub = ? WHERE id = ? AND auth_sub IS NULL')
        .bind(who.sub, row.id)
        .run();
    else if (isOwnerEmail(who.email, env)) row = await addOwner(env, who, now);
  }
  if (!row || row.blocked) return null;
  const day = new Date(now).toISOString().slice(0, 10);
  if (row.last_seen_day !== day)
    await env.DB.prepare('UPDATE members SET last_seen_day = ? WHERE id = ?')
      .bind(day, row.id)
      .run();
  return row;
}
