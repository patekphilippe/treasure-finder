import { exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapPlacement } from '@/shared/types/placement';

const worker = (exports as unknown as { default: Fetcher }).default;
let device = 0;

function place(fields: Record<string, string> = {}) {
  const body = new FormData();
  body.append(
    'image',
    new File([new Uint8Array([255, 216, 255, 0])], 'mapa.jpg', { type: 'image/jpeg' }),
  );
  const all = {
    w: '800',
    h: '600',
    view: '51.0,16.9,51.3,17.3',
    deviceId: `placer-${device}-abcdefghijkl`,
    turnstile: 'tok',
    ...fields,
  };
  for (const [k, v] of Object.entries(all)) body.append(k, v);
  return worker.fetch(
    new Request('https://api.test/api/placements', {
      method: 'POST',
      body,
      headers: { 'cf-connecting-ip': '198.51.100.20' },
    }),
  );
}

/** What Claude reads on the scan: the placement part of the pipeline's map schema. */
const reading = (patch: Record<string, unknown> = {}) => ({
  summary: 'Messtischblatt',
  series: 'messtischblatt',
  year: 1936,
  sheetNumber: '4868',
  legibility: 'dobra',
  // the printed frame fills the image
  frameCorners: {
    nw: { x: 0, y: 0 },
    ne: { x: 1, y: 0 },
    se: { x: 1, y: 1 },
    sw: { x: 0, y: 1 },
  },
  placeNames: [],
  ...patch,
});

describe('placing a scanned map', () => {
  let answer: unknown;
  let sent: { system?: string; output_config: unknown; max_tokens: number } | null;

  beforeEach(() => {
    device++;
    sent = null;
    answer = reading();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('turnstile')) return Response.json({ success: true });
      if (url.startsWith('https://api.anthropic.com/v1/messages')) {
        sent = JSON.parse(String(init?.body));
        return Response.json({
          content: [{ type: 'text', text: JSON.stringify(answer) }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 2500, output_tokens: 300 },
        });
      }
      // no names to look up in these tests
      return Response.json([]);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('from the sheet number and frame: the image corners are the sheet corners', async () => {
    const res = await place();
    expect(res.status).toBe(200);
    const body = (await res.json()) as MapPlacement;
    expect(body.method).toBe('arkusz');
    const [nw, ne, se, sw] = body.corners;
    expect(nw!.lat).toBeCloseTo(51.2, 6);
    expect(nw!.lng).toBeCloseTo(17, 6);
    expect(ne!.lng).toBeCloseTo(17 + 10 / 60, 6);
    expect(se!.lat).toBeCloseTo(51.1, 6);
    expect(sw!.lng).toBeCloseTo(17, 6);
    // a short answer: names and frame only, no objects
    expect(JSON.stringify(sent!.output_config)).not.toContain('"objects"');
    expect(sent!.max_tokens).toBe(4096);
    expect(sent!.system).toBeTruthy();
  });

  it('says so when nothing places the map, and asks for the bot check', async () => {
    answer = reading({ sheetNumber: null, frameCorners: null, placeNames: [] });
    const none = await place();
    expect(none.status).toBe(422);
    expect(((await none.json()) as { error: string }).error).toMatch(/nazw/);
    expect((await place({ turnstile: '' })).status).toBe(400);
    expect((await place({ w: '9000' })).status).toBe(400);
  });
});
