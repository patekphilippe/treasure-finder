import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubmissionCreated } from '@/shared/types/sources';
import type { Env } from '../src/env';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as Env;
const ADMIN = { authorization: 'Bearer test-admin-token-0123456789abcdef' };
let n = 0;

async function publicSubmission(consent = true): Promise<SubmissionCreated> {
  const body = new FormData();
  body.append('mode', consent ? 'public' : 'private');
  body.append('deviceId', `admin-device-${n}-abcdefgh`);
  body.append('turnstile', 'tok');
  body.append('text', 'młyn pod Kowarami');
  if (consent) body.append('consentPublish', 'true');
  body.append('files', new File([new Uint8Array([9, 9])], 'm.jpg', { type: 'image/jpeg' }));
  const res = await worker.fetch(
    new Request('https://api.test/api/submissions', {
      method: 'POST',
      body,
      headers: { 'cf-connecting-ip': `10.1.0.${n}` },
    }),
  );
  const c = (await res.json()) as SubmissionCreated;
  const result = {
    summary: 'Młyn',
    georef: null,
    objects: [
      {
        kind: 'mlyn',
        label: 'Młyn',
        lat: 50.7947,
        lng: 15.835,
        radiusM: 150,
        confidence: 0.6,
        reasons: [],
      },
    ],
  };
  await testEnv.DB.batch([
    testEnv.DB.prepare(
      'INSERT INTO results (submission_id, model, json, cost_usd, created_at) VALUES (?, ?, ?, 0.001, 0)',
    ).bind(c.id, 'claude-haiku-5-5', JSON.stringify(result)),
    testEnv.DB.prepare(`UPDATE submissions SET status = ? WHERE id = ?`).bind(
      consent ? 'do_przegladu' : 'gotowe',
      c.id,
    ),
  ]);
  return c;
}

const admin = (path: string, init: RequestInit = {}) =>
  worker.fetch(
    new Request(`https://api.test/api/admin/${path}`, {
      ...init,
      headers: { ...ADMIN, ...(init.headers ?? {}) },
    }),
  );

describe('review panel', () => {
  beforeEach(() => {
    n++;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ success: true }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('refuses requests without the admin token', async () => {
    const res = await worker.fetch(new Request('https://api.test/api/admin/submissions'));
    expect(res.status).toBe(401);
    const wrong = await worker.fetch(
      new Request('https://api.test/api/admin/budget', {
        headers: { authorization: 'Bearer nope' },
      }),
    );
    expect(wrong.status).toBe(401);
  });

  it('lists submissions waiting for review with their files and result', async () => {
    const c = await publicSubmission();
    const list = (await (await admin('submissions')).json()) as {
      id: string;
      files: { id: string }[];
      result: unknown;
    }[];
    const mine = list.find((s) => s.id === c.id)!;
    expect(mine.files).toHaveLength(1);
    expect(mine.result).toMatchObject({ summary: 'Młyn' });
    const img = await admin(`files/${mine.files[0]!.id}`);
    expect(img.headers.get('content-type')).toBe('image/jpeg');
  });

  it('approving puts the edited objects into the members-only base and deletes the photos', async () => {
    const c = await publicSubmission();
    const objects = [
      {
        kind: 'mlyn',
        label: 'Młyn wodny (poprawiony)',
        lat: 50.795,
        lng: 15.836,
        radiusM: 120,
        confidence: 0.7,
      },
    ];
    const res = await admin(`submissions/${c.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ objects, source: 'Kronika Kowar' }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(200);
    // into the members-only base, without an author; the old public packs are gone
    const row = await testEnv.DB.prepare(
      "SELECT kind, label, source, author_id, radius_m FROM community_objects WHERE label = 'Młyn wodny (poprawiony)'",
    ).first<Record<string, unknown>>();
    expect(row).toMatchObject({
      kind: 'mlyn',
      source: 'Kronika Kowar',
      author_id: null,
      radius_m: 120,
    });
    expect(
      (await worker.fetch(new Request('https://api.test/api/kontekst/index.json'))).status,
    ).toBe(410);
    expect((await testEnv.SOURCES.list({ prefix: `zgloszenia/${c.id}/` })).keys).toHaveLength(0);
    const again = await admin(`submissions/${c.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ objects }),
    });
    expect(again.status).toBe(409);
  });

  it('never publishes a private analysis', async () => {
    const c = await publicSubmission(false);
    const res = await admin(`submissions/${c.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ objects: [] }),
    });
    expect(res.status).toBe(409);
  });
});
