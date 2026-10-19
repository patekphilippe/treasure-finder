import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubmissionCreated, SubmissionView } from '@/shared/types/sources';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as { DB: D1Database; SOURCES: R2Bucket };
const ORIGIN = 'https://patekphilippe.github.io';
let device = 0;

function send(fields: Record<string, string>, files: File[] = [], ip = '203.0.113.7') {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  for (const f of files) body.append('files', f);
  return worker.fetch(
    new Request('https://api.test/api/submissions', {
      method: 'POST',
      body,
      headers: { origin: ORIGIN, 'cf-connecting-ip': ip },
    }),
  );
}
const photo = () =>
  new File([new Uint8Array([255, 216, 255, 0])], 'mapa.jpg', { type: 'image/jpeg' });

describe('submissions', () => {
  let turnstileOk = true;
  beforeEach(() => {
    device++;
    turnstileOk = true;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('turnstile')) return Response.json({ success: turnstileOk });
      throw new Error(`unexpected fetch ${url}`);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  const fields = () => ({
    mode: 'private',
    deviceId: `device-${device}-abcdefghijkl`,
    turnstile: 'tok',
  });

  it('stores a private photo, lets the key holder read it and delete it', async () => {
    const res = await send({ ...fields(), text: 'Mühle na północ od wsi' }, [photo()]);
    expect(res.status).toBe(201);
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const created = (await res.json()) as SubmissionCreated;
    expect(created.status).toBe('nowe');

    const stored = await testEnv.SOURCES.list({ prefix: `zgloszenia/${created.id}/` });
    expect(stored.objects).toHaveLength(1);

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
    expect(
      (await testEnv.SOURCES.list({ prefix: `zgloszenia/${created.id}/` })).objects,
    ).toHaveLength(0);
    const row = await testEnv.DB.prepare('SELECT id FROM submissions WHERE id = ?')
      .bind(created.id)
      .first();
    expect(row).toBeNull();
  });

  it('refuses a failed bot check', async () => {
    turnstileOk = false;
    const res = await send({ ...fields(), text: 'karczma' });
    expect(res.status).toBe(403);
  });

  it('allows five private analyses a day per device, then answers 429', async () => {
    const f = fields();
    for (let i = 0; i < 5; i++)
      expect((await send({ ...f, text: `opis ${i}` }, [], `198.51.100.${i}`)).status).toBe(201);
    const sixth = await send({ ...f, text: 'opis 6' }, [], '198.51.100.99');
    expect(sixth.status).toBe(429);
    expect(await sixth.json()).toEqual({
      error: 'Dzienny limit analiz został wykorzystany, spróbuj jutro',
    });
  });

  it('counts the IP limit across devices too', async () => {
    const ip = '192.0.2.50';
    for (let i = 0; i < 5; i++) {
      const res = await send(
        { mode: 'private', deviceId: `dev-ip-test-${i}-abcdefgh`, turnstile: 't', text: 'x' },
        [],
        ip,
      );
      expect(res.status).toBe(201);
    }
    const res = await send(
      { mode: 'private', deviceId: 'dev-ip-test-9-abcdefgh', turnstile: 't', text: 'x' },
      [],
      ip,
    );
    expect(res.status).toBe(429);
  });
});
