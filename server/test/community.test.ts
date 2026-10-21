import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { AdminCommunityObject, AdminMember, CommunityObject } from '@/shared/types/community';
import { publishObjects } from '../src/context/packs';
import type { Env } from '../src/env';
import { signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as Env;
const ADMIN = 'Bearer test-admin-token-0123456789abcdef';
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
const invite = async (name: string) => {
  const email = `${name.toLowerCase()}@example.com`;
  const res = await call('admin/members', ADMIN, {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
  expect(res.status).toBe(201);
  const m = (await res.json()) as { id: string };
  return { id: m.id, email, auth: await signedInAs(email) };
};
const add = (auth: string, body: Record<string, unknown>) =>
  call('community/objects', auth, { method: 'POST', body: JSON.stringify(body) });
const list = async (auth: string, bbox = BBOX) =>
  (await (await call(`community/objects?bbox=${bbox}`, auth)).json()) as CommunityObject[];
const mill = {
  kind: 'mlyn',
  label: 'Młyn nad Łomnicą',
  lat: 50.8,
  lng: 15.8,
  radiusM: 150,
  source: 'Messtischblatt 1886',
};

describe('community', () => {
  it('only invited, unblocked members get in', async () => {
    const anna = await invite('Anna');
    expect(await (await call('community/me', anna.auth)).json()).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
      owner: false,
    });
    expect((await call('community/me', null)).status).toBe(401);
    expect((await call('community/me', 'Bearer not-a-real-token-0000000')).status).toBe(401);
    expect((await call('community/me', await signedInAs('stranger@example.com'))).status).toBe(401);
    expect((await call('community/objects?bbox=' + BBOX, null)).status).toBe(401);
    await call(`admin/members/${anna.id}/block`, ADMIN, { method: 'POST' });
    expect((await call('community/me', anna.auth)).status).toBe(401);
    await call(`admin/members/${anna.id}/unblock`, ADMIN, { method: 'POST' });
    expect((await call('community/me', anna.auth)).status).toBe(200);
  });

  it('a member’s object is visible at once to others, with author and votes', async () => {
    const bart = await invite('Bartek');
    const cela = await invite('Cela');
    const res = await add(bart.auth, mill);
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };

    const seenByCela = (await list(cela.auth)).find((o) => o.id === id)!;
    expect(seenByCela).toMatchObject({
      kind: 'mlyn',
      author: 'Bartek',
      mineAuthor: false,
      up: 0,
      down: 0,
      mine: 0,
    });
    expect((await list(bart.auth)).find((o) => o.id === id)!.mineAuthor).toBe(true);

    // one vote per member, changeable; not on one's own object
    await call(`community/objects/${id}/vote`, cela.auth, {
      method: 'POST',
      body: JSON.stringify({ vote: 1 }),
    });
    await call(`community/objects/${id}/vote`, cela.auth, {
      method: 'POST',
      body: JSON.stringify({ vote: 1 }),
    });
    expect((await list(cela.auth)).find((o) => o.id === id)).toMatchObject({
      up: 1,
      down: 0,
      mine: 1,
    });
    await call(`community/objects/${id}/vote`, cela.auth, {
      method: 'POST',
      body: JSON.stringify({ vote: -1, note: 'za daleko od rzeki' }),
    });
    expect((await list(cela.auth)).find((o) => o.id === id)).toMatchObject({
      up: 0,
      down: 1,
      mine: -1,
    });
    expect(
      (
        await call(`community/objects/${id}/vote`, bart.auth, {
          method: 'POST',
          body: JSON.stringify({ vote: 1 }),
        })
      ).status,
    ).toBe(403);
  });

  it('the author moves their objects after placing the map better; nobody else can', async () => {
    const dora = await invite('Dora');
    const emil = await invite('Emil');
    const ids = await Promise.all(
      [0, 1].map(async (k) => {
        const res = await add(dora.auth, { ...mill, lat: 50.8 + k / 100 });
        return ((await res.json()) as { id: string }).id;
      }),
    );
    const moves = ids.map((id, k) => ({ id, lat: 50.79 + k / 100, lng: 15.79 }));
    const move = (auth: string, body: unknown) =>
      call('community/objects/moves', auth, { method: 'POST', body: JSON.stringify(body) });

    // someone else's objects stay where they are
    expect(await (await move(emil.auth, { moves })).json()).toEqual({ moved: 0 });
    expect(await (await move(dora.auth, { moves })).json()).toEqual({ moved: 2 });
    const seen = (await list(emil.auth)).filter((o) => ids.includes(o.id));
    expect(seen.map((o) => [o.lat, o.lng]).sort()).toEqual([
      [50.79, 15.79],
      [50.8, 15.79],
    ]);
    // outside Poland or too many: refused whole
    expect((await move(dora.auth, { moves: [{ id: ids[0], lat: 60, lng: 15 }] })).status).toBe(400);
    expect((await move(dora.auth, { moves: [] })).status).toBe(400);
  });

  it('bad objects and huge areas are refused', async () => {
    const d = await invite('Darek');
    expect((await add(d.auth, { ...mill, kind: 'znalezisko' })).status).toBe(400);
    // positions and war graves from military maps are shared like any map object
    expect((await add(d.auth, { ...mill, kind: 'wojsko', label: 'Okopy' })).status).toBe(201);
    expect((await add(d.auth, { ...mill, kind: 'grob_wojenny', label: 'Mogiła' })).status).toBe(
      201,
    );
    expect((await add(d.auth, { ...mill, lat: 40 })).status).toBe(400);
    expect((await call('community/objects?bbox=49,14,52,18', d.auth)).status).toBe(400);
  });

  it('only the author removes; the owner sees disputed objects with notes and can restore', async () => {
    const e = await invite('Ewa');
    const f = await invite('Filip');
    const g = await invite('Gosia');
    const { id } = (await (
      await add(e.auth, { ...mill, lat: 50.81, label: 'Karczma?', kind: 'karczma' })
    ).json()) as { id: string };
    for (const [who, note] of [
      [f, 'nic tu nie ma'],
      [g, 'to leśniczówka'],
    ] as const)
      await call(`community/objects/${id}/vote`, who.auth, {
        method: 'POST',
        body: JSON.stringify({ vote: -1, note }),
      });

    const disputed = (await (
      await call('admin/objects?filter=disputed', ADMIN)
    ).json()) as AdminCommunityObject[];
    expect(disputed.find((o) => o.id === id)).toMatchObject({ down: 2, author: 'Ewa' });
    expect(disputed.find((o) => o.id === id)!.notes.sort()).toEqual([
      'nic tu nie ma',
      'to leśniczówka',
    ]);

    expect((await call(`community/objects/${id}`, f.auth, { method: 'DELETE' })).status).toBe(403);
    expect((await call(`community/objects/${id}`, e.auth, { method: 'DELETE' })).status).toBe(204);
    expect((await list(f.auth)).some((o) => o.id === id)).toBe(false);
    await call(`admin/objects/${id}/restore`, ADMIN, { method: 'POST' });
    expect((await list(f.auth)).some((o) => o.id === id)).toBe(true);
    await call(`admin/objects/${id}/remove`, ADMIN, { method: 'POST' });
    expect((await list(f.auth)).some((o) => o.id === id)).toBe(false);

    const members = (await (await call('admin/members', ADMIN)).json()) as AdminMember[];
    expect(members.find((m) => m.name === 'Filip')).toMatchObject({ votes: 1, blocked: false });
  });

  it('moves the old public packs into the base once', async () => {
    await publishObjects(
      testEnv.CONTEXT,
      [
        {
          kind: 'brod',
          label: 'Furt',
          lat: 50.85,
          lng: 15.85,
          radiusM: 100,
          confidence: 0.8,
          reasons: [],
        },
      ],
      'Wspólna baza źródeł',
      Date.now(),
    );
    const first = (await (await call('admin/migrate-packs', ADMIN, { method: 'POST' })).json()) as {
      moved: number;
    };
    expect(first.moved).toBeGreaterThanOrEqual(1);
    const again = (await (await call('admin/migrate-packs', ADMIN, { method: 'POST' })).json()) as {
      moved: number;
    };
    expect(again.moved).toBe(0);
    const h = await invite('Henryk');
    expect((await list(h.auth)).find((o) => o.label === 'Furt')).toMatchObject({
      kind: 'brod',
      author: null,
    });
  });
});
