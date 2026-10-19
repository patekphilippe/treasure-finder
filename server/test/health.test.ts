import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { addSpending } from '../src/budget';

const worker = (exports as unknown as { default: Fetcher }).default;
const api = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://api.test${path}`, init));
const db = (env as unknown as { DB: D1Database }).DB;

describe('health', () => {
  it('answers with CORS headers for the app origin only', async () => {
    const ok = await api('/api/health', { headers: { origin: 'https://patekphilippe.github.io' } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://patekphilippe.github.io');
    expect(await ok.json()).toEqual({ ok: true, aiAvailable: true });

    const other = await api('/api/health', { headers: { origin: 'https://evil.example' } });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('reports AI as unavailable once the monthly budget is spent', async () => {
    await addSpending(db, Date.now(), 5.01);
    const res = await api('/api/health');
    expect(await res.json()).toEqual({ ok: true, aiAvailable: false });
  });

  it('answers 404 in Polish for unknown paths', async () => {
    const res = await api('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Nie ma takiego adresu' });
  });
});
