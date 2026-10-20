import { afterEach, describe, expect, it, vi } from 'vitest';
import { readMapWithAi } from '@/features/history/services/readMapWithAi';
import { BACKEND_URL } from '@/shared/config/backend';

const image = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const answer = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('reading a map through the backend', () => {
  it('posts the view to /api/readings without any API key and returns the objects', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'device-0123456789abcdef', setItem: () => {} });
    const fetch = answer(200, {
      objects: [{ kind: 'mlyn', label: 'Mühle', x: 40, y: 60, confidence: 0.9 }],
      usage: { inputTokens: 2100, outputTokens: 180 },
    });
    vi.stubGlobal('fetch', fetch);
    const r = await readMapWithAi(
      image,
      800,
      600,
      1.5,
      'claude-haiku-5-5',
      'wojskowa',
      'turnstile-token',
    );
    expect(r.objects).toEqual([{ kind: 'mlyn', label: 'Mühle', x: 40, y: 60, confidence: 0.9 }]);
    expect(r.usage).toEqual({ inputTokens: 2100, outputTokens: 180 });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BACKEND_URL}/api/readings`);
    expect(init.headers).toBeUndefined();
    const form = init.body as FormData;
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== 'image'))).toEqual({
      w: '800',
      h: '600',
      res: '1.5',
      model: 'claude-haiku-5-5',
      profile: 'wojskowa',
      deviceId: 'device-0123456789abcdef',
      turnstile: 'turnstile-token',
    });
    expect(form.get('image')).toBeInstanceOf(Blob);
  });

  it('shows the server’s Polish message, or a plain one when it is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      answer(429, { error: 'Dzienny limit odczytów map został wykorzystany, spróbuj jutro' }),
    );
    await expect(readMapWithAi(image, 10, 10, 1, 'claude-haiku-5-5', 'topo', 't')).rejects.toThrow(
      /limit odczytów/,
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(readMapWithAi(image, 10, 10, 1, 'claude-haiku-5-5', 'topo', 't')).rejects.toThrow(
      'Brak połączenia z serwerem analizy',
    );
  });
});
