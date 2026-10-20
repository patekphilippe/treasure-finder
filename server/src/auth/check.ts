import { cleanEmail } from '@/shared/lib/cleanEmail';
import { sameSecret } from '../crypto';
import type { Env } from '../env';
import { bearer, fail, json } from '../http';
import { isOwnerEmail } from './isOwnerEmail';

type Cors = Record<string, string>;

/**
 * POST /api/auth/check, asked by the Auth0 Post-Login Action (server/auth0/postLogin.js) at every
 * sign-in: only invited, unblocked addresses and the owner get through, so nobody else can even
 * register. Guarded by AUTH0_ACTION_SECRET, shared with the Action.
 */
export async function authCheck(request: Request, env: Env, cors: Cors): Promise<Response> {
  if (!(await sameSecret(bearer(request), env.AUTH0_ACTION_SECRET)))
    return fail(401, 'Brak dostępu', cors);
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = cleanEmail(body?.email);
  if (!email) return fail(400, 'Brak adresu e-mail', cors);
  if (isOwnerEmail(email, env)) return json({ allowed: true }, 200, cors);
  const row = await env.DB.prepare('SELECT blocked FROM members WHERE email = ?')
    .bind(email)
    .first<{ blocked: number }>();
  return json({ allowed: Boolean(row && !row.blocked) }, 200, cors);
}
