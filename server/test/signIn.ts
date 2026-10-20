import { env } from 'cloudflare:workers';
import { CLAIMS } from '../src/auth/session';

const testEnv = env as unknown as {
  TEST_SIGNING_KEY: string;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
};

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const part = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

/**
 * `Authorization` of someone signed in with Auth0 as `email`: an access token like the one the
 * Action makes, signed with the test key (vitest.config.ts). `claims` override any field.
 */
export async function signedInAs(
  email: string,
  claims: Record<string, unknown> = {},
  key?: CryptoKey,
): Promise<string> {
  const signer =
    key ??
    (await crypto.subtle.importKey(
      'jwk',
      JSON.parse(testEnv.TEST_SIGNING_KEY) as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    ));
  const now = Math.floor(Date.now() / 1000);
  const head = part({ alg: 'RS256', typ: 'JWT', kid: 'test' });
  const body = part({
    iss: `https://${testEnv.AUTH0_DOMAIN}/`,
    aud: [testEnv.AUTH0_AUDIENCE, `https://${testEnv.AUTH0_DOMAIN}/userinfo`],
    sub: `google-oauth2|${email}`,
    iat: now,
    exp: now + 3600,
    [`${CLAIMS}email`]: email,
    [`${CLAIMS}name`]: '',
    ...claims,
  });
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signer,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `Bearer ${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

let invitedCount = 0;

/** `Authorization` of a freshly invited and signed-in member (each call a new one, own limits). */
export async function invitedMember(worker: Fetcher, name = 'Członek'): Promise<string> {
  const email = `invited${++invitedCount}-${Date.now()}@example.com`;
  await worker.fetch(
    new Request('https://api.test/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
      headers: { authorization: 'Bearer test-admin-token-0123456789abcdef' },
    }),
  );
  return signedInAs(email);
}
