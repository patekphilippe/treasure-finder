import type { Env } from '../env';
import { bearer } from '../http';
import { verifyJwt, type Jwk } from './jwt';

/** Namespace of the claims the Auth0 Action adds to the access token (server/auth0/postLogin.js). */
export const CLAIMS = 'https://treasure-finder/';

export interface SignedIn {
  /** Auth0 user id, e.g. `google-oauth2|1234` */
  sub: string;
  /** verified address, lower case */
  email: string;
  /** first name from the OAuth provider; may be empty */
  name: string;
}

/** the tenant's keys rarely change: kept for 6 hours, an unknown `kid` refetches at most every 5 minutes */
const KEYS_TTL_MS = 6 * 3600_000;
const REFETCH_GAP_MS = 5 * 60_000;
let cached: { domain: string; keys: Jwk[]; at: number } | null = null;

async function tenantKey(env: Env, now: number, kid: string): Promise<Jwk | undefined> {
  if (env.AUTH0_JWKS)
    return (JSON.parse(env.AUTH0_JWKS) as { keys: Jwk[] }).keys.find((k) => k.kid === kid);
  const c = cached?.domain === env.AUTH0_DOMAIN ? cached : null;
  const known = c?.keys.find((k) => k.kid === kid);
  if (c && now - c.at < (known ? KEYS_TTL_MS : REFETCH_GAP_MS)) return known;
  const res = await fetch(`https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`).catch(() => null);
  if (!res?.ok) return known;
  const { keys } = (await res.json()) as { keys?: Jwk[] };
  cached = { domain: env.AUTH0_DOMAIN, keys: keys ?? [], at: now };
  return cached.keys.find((k) => k.kid === kid);
}

/**
 * The person behind `Authorization: Bearer <Auth0 access token>`, or null (no token, invalid,
 * expired, sign-in not set up). The Action lets only invited addresses sign in; the worker still
 * checks the members itself (community/auth.ts).
 */
export async function signedIn(request: Request, env: Env, now: number): Promise<SignedIn | null> {
  const token = bearer(request);
  if (!token || !env.AUTH0_DOMAIN || !env.AUTH0_AUDIENCE) return null;
  const claims = await verifyJwt(token, (kid) => tenantKey(env, now, kid), {
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    audience: env.AUTH0_AUDIENCE,
    now,
  });
  const email = claims?.[`${CLAIMS}email`];
  if (!claims || typeof claims.sub !== 'string' || typeof email !== 'string' || !email) return null;
  const name = claims[`${CLAIMS}name`];
  return {
    sub: claims.sub,
    email: email.toLowerCase(),
    name: typeof name === 'string' ? name.trim().slice(0, 60) : '',
  };
}
