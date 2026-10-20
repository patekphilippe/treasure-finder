/** One public key of the Auth0 tenant (its JWKS). */
export interface Jwk {
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
}

export interface JwtCheck {
  issuer: string;
  audience: string;
  now: number;
}

/** clock difference tolerated between Auth0 and the worker */
const SKEW_S = 60;

const bytes = (b64url: string) => {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const decode = (b64url: string) =>
  JSON.parse(new TextDecoder().decode(bytes(b64url))) as Record<string, unknown>;

/**
 * Claims of an RS256 JWT signed with the key `keyFor` returns for its `kid`, issued by `issuer`
 * for `audience` and not expired; null for anything else (no `alg: none`, no HMAC).
 */
export async function verifyJwt(
  token: string,
  keyFor: (kid: string) => Promise<Jwk | undefined>,
  check: JwtCheck,
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts as [string, string, string];
  try {
    const header = decode(head);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    const jwk = await keyFor(header.kid);
    if (jwk?.kty !== 'RSA' || !jwk.n || !jwk.e) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n, e: jwk.e },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signed = new TextEncoder().encode(`${head}.${body}`);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bytes(sig), signed))) return null;
    const claims = decode(body);
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const nowS = check.now / 1000;
    if (claims.iss !== check.issuer || !aud.includes(check.audience)) return null;
    if (typeof claims.exp !== 'number' || claims.exp < nowS - SKEW_S) return null;
    if (typeof claims.nbf === 'number' && claims.nbf > nowS + SKEW_S) return null;
    return claims;
  } catch {
    // broken base64, JSON or key
    return null;
  }
}
