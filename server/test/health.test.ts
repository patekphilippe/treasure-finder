import { env, exports } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAiKeyCache } from '../src/aiKeyStatus';
import { addSpending } from '../src/budget';

const worker = (exports as unknown as { default: Fetcher }).default;
const api = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://api.test${path}`, init));
const db = (env as unknown as { DB: D1Database }).DB;

const anthropicAnswers = (status: number) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}', { status }));

describe('health', () => {
  beforeEach(() => {
    resetAiKeyCache();
    vi.restoreAllMocks();
  });

  it('answers with CORS headers for the app origin only', async () => {
    anthropicAnswers(200);
    const ok = await api('/api/health', { headers: { origin: 'https://patekphilippe.github.io' } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://patekphilippe.github.io');
    expect(await ok.json()).toEqual({
      ok: true,
      aiAvailable: true,
      aiKey: 'ok',
      sourcesAvailable: true,
      reliefStored: true,
    });

    const other = await api('/api/health', { headers: { origin: 'https://evil.example' } });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('reports AI as unavailable once the monthly budget is spent', async () => {
    anthropicAnswers(200);
    await addSpending(db, Date.now(), 5.01);
    const res = await api('/api/health');
    expect(await res.json()).toMatchObject({ ok: true, aiAvailable: false, aiKey: 'ok' });
  });

  it('a rejected key is reported (and checked once, not on every request)', async () => {
    const fetch = anthropicAnswers(401);
    expect(await (await api('/api/health')).json()).toMatchObject({
      aiAvailable: false,
      aiKey: 'invalid',
    });
    await api('/api/health');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]![0])).toBe('https://api.anthropic.com/v1/models?limit=1');
  });

  it('Anthropic unreachable: "unknown", asked again next time', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await (await api('/api/health')).json()).toMatchObject({ aiKey: 'unknown' });
    await api('/api/health');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('answers 404 in Polish for unknown paths', async () => {
    const res = await api('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Nie ma takiego adresu' });
  });
});
