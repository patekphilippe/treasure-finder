import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { AdminMember } from '@/shared/types/community';
import { verifyJwt } from '../src/auth/jwt';
import { signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as { AUTH0_JWKS: string; AUTH0_ACTION_SECRET: string };
const OWNER = 'owner@example.com';
const BBOX = '50.7,15.7,50.9,15.9';

const call = (path: string, auth: string | null, init: RequestInit = {}) =>
  worker.fetch(
    new Request(`https://api.test/api/${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: auth } : {}),
        ...init.headers,
      },
    }),
  );
const post = (path: string, auth: string | null, body: unknown) =>
  call(path, auth, { method: 'POST', body: JSON.stringify(body) });
const check = async (email: string, secret = testEnv.AUTH0_ACTION_SECRET) =>
  post('auth/check', `Bearer ${secret}`, { email });

describe('sign-in with Auth0', () => {
  it('accepts only tokens signed by the tenant, for this API, not expired', async () => {
    const keys = (JSON.parse(testEnv.AUTH0_JWKS) as { keys: { kid: string }[] }).keys;
    const keyFor = async (kid: string) => keys.find((k) => k.kid === kid);
    const opts = { issuer: 'https://login.test/', audience: 'https://treasure-finder-api' };
    const token = (await signedInAs('a@example.com')).slice('Bearer '.length);
    expect(await verifyJwt(token, keyFor, { ...opts, now: Date.now() })).toMatchObject({
      sub: 'google-oauth2|a@example.com',
    });
    expect(await verifyJwt(token, keyFor, { ...opts, now: Date.now() + 2 * 3600_000 })).toBeNull();
    expect(
      await verifyJwt(token, keyFor, { ...opts, audience: 'https://other', now: Date.now() }),
    ).toBeNull();
    expect(
      await verifyJwt(token, keyFor, { ...opts, issuer: 'https://evil/', now: Date.now() }),
    ).toBeNull();
    // a changed payload breaks the signature
    const [h, , s] = token.split('.');
    const forged = btoa(JSON.stringify({ sub: 'x', aud: opts.audience, iss: opts.issuer }));
    expect(await verifyJwt(`${h}.${forged}.${s}`, keyFor, { ...opts, now: Date.now() })).toBeNull();
    expect(await verifyJwt('not.a.jwt', keyFor, { ...opts, now: Date.now() })).toBeNull();

    // someone else's key
    const other = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    );
    const foreign = await signedInAs(OWNER, {}, (other as CryptoKeyPair).privateKey);
    expect((await call('community/me', foreign)).status).toBe(401);
    expect((await call('admin/members', foreign)).status).toBe(401);
  });

  it('the owner needs no invitation and gets the panel; members do not', async () => {
    const owner = await signedInAs(OWNER, { 'https://treasure-finder/name': 'Philip' });
    expect(await (await call('community/me', owner)).json()).toEqual({
      name: 'Philip',
      email: OWNER,
      owner: true,
    });
    expect((await call('admin/members', owner)).status).toBe(200);

    expect(
      (await post('admin/members', owner, { name: 'Jan', email: 'Jan@Example.com' })).status,
    ).toBe(201);
    expect(
      (await post('admin/members', owner, { name: 'Jan 2', email: 'jan@example.com' })).status,
    ).toBe(409);
    expect((await post('admin/members', owner, { name: 'Bez adresu' })).status).toBe(400);
    const jan = await signedInAs('jan@example.com');
    expect((await call('community/me', jan)).status).toBe(200);
    expect((await call('admin/members', jan)).status).toBe(401);
  });

  it('the first sign-in takes the invitation; a new address moves the member to a new account', async () => {
    const owner = await signedInAs(OWNER);
    await post('admin/members', owner, { name: 'Kasia', email: 'kasia@example.com' });
    const kasia = await signedInAs('kasia@example.com');
    const created = await post('community/objects', kasia, {
      kind: 'mlyn',
      label: 'Młyn',
      lat: 50.8,
      lng: 15.8,
      source: 'Messtischblatt 1886',
    });
    expect(created.status).toBe(201);

    let members = (await (await call('admin/members', owner)).json()) as AdminMember[];
    const row = members.find((m) => m.name === 'Kasia')!;
    expect(row).toMatchObject({ email: 'kasia@example.com', linked: true, objects: 1 });
    // another account with the same address cannot take the member over
    const twin = await signedInAs('kasia@example.com', { sub: 'apple|kasia' });
    expect((await call('community/me', twin)).status).toBe(401);

    expect(
      (await post(`admin/members/${row.id}/email`, owner, { email: 'jan@example.com' })).status,
    ).toBe(409);
    expect(
      (await post(`admin/members/${row.id}/email`, owner, { email: 'k@example.com' })).status,
    ).toBe(200);
    expect((await call('community/me', kasia)).status).toBe(401);
    const moved = await signedInAs('k@example.com');
    expect(await (await call('community/me', moved)).json()).toMatchObject({ name: 'Kasia' });
    const objects = (await (await call(`community/objects?bbox=${BBOX}`, moved)).json()) as {
      mineAuthor: boolean;
    }[];
    expect(objects.some((o) => o.mineAuthor)).toBe(true);
    members = (await (await call('admin/members', owner)).json()) as AdminMember[];
    expect(members.find((m) => m.id === row.id)).toMatchObject({ linked: true });
  });

  it('tells the Auth0 Action who may sign in', async () => {
    const owner = await signedInAs(OWNER);
    const res = await post('admin/members', owner, { name: 'Lena', email: 'lena@example.com' });
    const { id } = (await res.json()) as { id: string };
    const allowed = async (email: string) =>
      ((await (await check(email)).json()) as { allowed: boolean }).allowed;

    expect(await allowed('LENA@example.com')).toBe(true);
    expect(await allowed(OWNER)).toBe(true);
    expect(await allowed('nobody@example.com')).toBe(false);
    await call(`admin/members/${id}/block`, owner, { method: 'POST' });
    expect(await allowed('lena@example.com')).toBe(false);

    expect((await check('lena@example.com', 'wrong-secret-0123456789abcdef')).status).toBe(401);
    expect((await post('auth/check', null, { email: OWNER })).status).toBe(401);
  });
});
