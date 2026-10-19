import { sha256Hex } from '../crypto';
import type { Env } from '../env';

export interface MemberRow {
  id: string;
  name: string;
  blocked: number;
  last_seen_day: string | null;
}

/** The member's invitation code from `Authorization: Bearer <kod>`; null when absent. */
export function bearer(request: Request): string | null {
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  return given || null;
}

/**
 * The member behind the invitation code, or null (no code, unknown, blocked). Codes are stored
 * only as SHA-256, so a leaked database does not let anyone in. Notes the day of the last visit.
 */
export async function memberFrom(
  request: Request,
  env: Env,
  now: number,
): Promise<MemberRow | null> {
  const code = bearer(request);
  if (!code || code.length < 16) return null;
  const row = await env.DB.prepare(
    'SELECT id, name, blocked, last_seen_day FROM members WHERE token_hash = ?',
  )
    .bind(await sha256Hex(code))
    .first<MemberRow>();
  if (!row || row.blocked) return null;
  const day = new Date(now).toISOString().slice(0, 10);
  if (row.last_seen_day !== day)
    await env.DB.prepare('UPDATE members SET last_seen_day = ? WHERE id = ?')
      .bind(day, row.id)
      .run();
  return row;
}
