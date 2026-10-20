import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubmissionCreated, SubmissionView } from '@/shared/types/sources';
import { signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as { DB: D1Database; SOURCES: KVNamespace };
const ORIGIN = 'https://patekphilippe.github.io';
let device = 0;
// a signed-in member for each test (beforeEach)
let sender: string;

async function member(name: string): Promise<string> {
  const email = `${name.toLowerCase()}@example.com`;
  await worker.fetch(
    new Request('https://api.test/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
      headers: { authorization: 'Bearer test-admin-token-0123456789abcdef' },
    }),
  );
  return signedInAs(email);
}

function send(fields: Record<string, string>, files: File[] = [], auth: string | null = sender) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  for (const f of files) body.append('files', f);
  return worker.fetch(
    new Request('https://api.test/api/submissions', {
      method: 'POST',
      body,
      headers: { origin: ORIGIN, ...(auth ? { authorization: auth } : {}) },
    }),
  );
}
const photo = () =>
  new File([new Uint8Array([255, 216, 255, 0])], 'mapa.jpg', { type: 'image/jpeg' });

describe('submissions', () => {
  beforeEach(async () => {
    device++;
    sender = await member(`Sender${device}`);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      throw new Error(`unexpected fetch ${url}`);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  const fields = () => ({
    mode: 'private',
    deviceId: `device-${device}-abcdefghijkl`,
  });

  it('stores a private photo, lets the key holder read it and delete it', async () => {
    const res = await send({ ...fields(), text: 'Mühle na północ od wsi' }, [photo()]);
    expect(res.status).toBe(201);
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const created = (await res.json()) as SubmissionCreated;
    expect(created.status).toBe('nowe');

    const stored = await testEnv.SOURCES.list({ prefix: `zgloszenia/${created.id}/` });
    expect(stored.keys).toHaveLength(1);

    const view = await worker.fetch(
      new Request(`https://api.test/api/submissions/${created.id}?key=${created.accessKey}`),
    );
    expect(view.status).toBe(200);
    expect((await view.json()) as SubmissionView).toMatchObject({
      id: created.id,
      mode: 'private',
      status: 'nowe',
      result: null,
    });

    const wrong = await worker.fetch(
      new Request(`https://api.test/api/submissions/${created.id}?key=zly-klucz`),
    );
    expect(wrong.status).toBe(404);

    const del = await worker.fetch(
      new Request(`https://api.test/api/submissions/${created.id}?key=${created.accessKey}`, {
        method: 'DELETE',
      }),
    );
    expect(del.status).toBe(204);
    expect((await testEnv.SOURCES.list({ prefix: `zgloszenia/${created.id}/` })).keys).toHaveLength(
      0,
    );
    const row = await testEnv.DB.prepare('SELECT id FROM submissions WHERE id = ?')
      .bind(created.id)
      .first();
    expect(row).toBeNull();
  });

  it('refuses anyone not signed in with an invitation', async () => {
    const res = await send({ ...fields(), text: 'karczma' }, [], null);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toMatch(/Zaloguj się/);
    const stranger = await signedInAs('stranger@example.com');
    expect((await send({ ...fields(), text: 'karczma' }, [], stranger)).status).toBe(401);
  });

  it('allows five private analyses a day per member, then answers 429', async () => {
    const f = fields();
    for (let i = 0; i < 5; i++) expect((await send({ ...f, text: `opis ${i}` })).status).toBe(201);
    const sixth = await send({ ...f, text: 'opis 6' });
    expect(sixth.status).toBe(429);
    expect(await sixth.json()).toEqual({
      error: 'Dzienny limit analiz został wykorzystany, spróbuj jutro',
    });
    // another member still sends
    expect((await send({ ...f, text: 'opis' }, [], await member(`Next${device}`))).status).toBe(
      201,
    );
  });
});
