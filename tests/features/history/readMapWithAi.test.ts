import { afterEach, describe, expect, it, vi } from 'vitest';
import { readMapWithAi } from '@/features/history/services/readMapWithAi';

const image = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const answer = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('reading a map with Claude', () => {
  it('sends the image with the JSON format and the key, and reads the objects back', async () => {
    const fetch = answer(200, {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            objects: [{ kind: 'mlyn', label: 'Mühle', x: 40, y: 60, confidence: 0.9 }],
          }),
        },
      ],
      stop_reason: 'end_turn',
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
    // no forced tool: Sonnet 5.5 rejects tool_choice "tool" with a 400
    expect(body.tool_choice).toBeUndefined();
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.messages[0].content[0].source).toEqual({
      type: 'base64',
      media_type: 'image/jpeg',
      data: 'AQID',
    });
    expect(body.messages[0].content[1].text).toMatch(/800 × 600 pixels.*1 pixel = 1\.5 m/s);
  });

  it('works the same for Sonnet', async () => {
    const fetch = answer(200, { content: [{ type: 'text', text: '{"objects":[]}' }], usage: {} });
    vi.stubGlobal('fetch', fetch);
    const r = await readMapWithAi(image, 10, 10, 1, 'k', 'claude-sonnet-5-5');
    expect(r.objects).toEqual([]);
    expect(JSON.parse(fetch.mock.calls[0]![1].body).model).toBe('claude-sonnet-5-5');
  });

  it('a refusal and broken JSON become clear messages', async () => {
    vi.stubGlobal('fetch', answer(200, { content: [], stop_reason: 'refusal' }));
    await expect(readMapWithAi(image, 10, 10, 1, 'k', 'claude-haiku-5-5')).rejects.toThrow(
      'odmówił',
    );
    vi.stubGlobal('fetch', answer(200, { content: [{ type: 'text', text: '{oops' }] }));
    await expect(readMapWithAi(image, 10, 10, 1, 'k', 'claude-haiku-5-5')).rejects.toThrow(
      'Nieczytelna',
    );
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
