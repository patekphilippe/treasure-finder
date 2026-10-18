import { afterEach, describe, expect, it, vi } from 'vitest';
import { readMapWithAi } from '@/features/history/services/readMapWithAi';

const image = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const answer = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('reading a map with Claude', () => {
  it('sends the image with the forced tool and the key, and reads the objects back', async () => {
    const fetch = answer(200, {
      content: [
        {
          type: 'tool_use',
          input: { objects: [{ kind: 'mlyn', label: 'Mühle', x: 40, y: 60, confidence: 0.9 }] },
        },
      ],
      usage: { input_tokens: 2100, output_tokens: 180 },
    });
    vi.stubGlobal('fetch', fetch);
    const r = await readMapWithAi(image, 800, 600, 1.5, 'sk-test', 'claude-haiku-5-5');
    expect(r.objects).toEqual([{ kind: 'mlyn', label: 'Mühle', x: 40, y: 60, confidence: 0.9 }]);
    expect(r.usage).toEqual({ inputTokens: 2100, outputTokens: 180 });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-test');
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('claude-haiku-5-5');
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'report_objects' });
    expect(body.messages[0].content[0].source).toEqual({
      type: 'base64',
      media_type: 'image/jpeg',
      data: 'AQID',
    });
    expect(body.messages[0].content[1].text).toMatch(/800 × 600 pixels.*1 pixel = 1\.5 m/s);
  });

  it('a wrong key and other errors become clear messages', async () => {
    vi.stubGlobal('fetch', answer(401, { error: { message: 'invalid x-api-key' } }));
    await expect(readMapWithAi(image, 10, 10, 1, 'bad', 'claude-haiku-5-5')).rejects.toThrow(
      'Klucz API jest nieprawidłowy',
    );
    vi.stubGlobal('fetch', answer(400, { error: { message: 'image too large' } }));
    await expect(readMapWithAi(image, 10, 10, 1, 'k', 'claude-haiku-5-5')).rejects.toThrow(
      'image too large',
    );
  });
});
