import { exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapPlacement } from '@/shared/types/placement';
import { signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
let device = 0;
// a signed-in member for each test (beforeEach)
let placer: string;

function place(fields: Record<string, string> = {}, auth: string | null = placer) {
  const body = new FormData();
  body.append(
    'image',
    new File([new Uint8Array([255, 216, 255, 0])], 'mapa.jpg', { type: 'image/jpeg' }),
  );
  const all = {
    w: '800',
    h: '600',
    view: '51.0,16.9,51.3,17.3',
    ...fields,
  };
  for (const [k, v] of Object.entries(all)) body.append(k, v);
  return worker.fetch(
    new Request('https://api.test/api/placements', {
      method: 'POST',
      body,
      headers: auth ? { authorization: auth } : {},
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

  beforeEach(async () => {
    device++;
    const email = `placer${device}@example.com`;
    await worker.fetch(
      new Request('https://api.test/api/admin/members', {
        method: 'POST',
        body: JSON.stringify({ name: `Placer${device}`, email }),
        headers: { authorization: 'Bearer test-admin-token-0123456789abcdef' },
      }),
    );
    placer = await signedInAs(email);
    sent = null;
    answer = reading();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith('https://api.anthropic.com/v1/messages')) {
        sent = JSON.parse(String(init?.body));
        return Response.json({
          content: [{ type: 'text', text: JSON.stringify(answer) }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 2500, output_tokens: 300 },
        });
      }
      // the only place the tests look up: Poznań, the town KdDR sheet 301 is named after
      if (url.includes('nominatim') && new URL(url).searchParams.get('q') === 'Posen')
        return Response.json([
          { lat: '52.4083', lon: '16.9335', display_name: 'Poznań, Polska', category: 'place' },
        ]);
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

  it('a Karte des Deutschen Reiches sheet by its title: the frame on the grid cell of the town', async () => {
    answer = reading({ series: 'kdr', sheetNumber: '301', sheetTitle: 'Posen', year: 1921 });
    const res = await place();
    expect(res.status).toBe(200);
    const [nw, ne, se] = ((await res.json()) as MapPlacement).corners;
    expect(nw!.lat).toBeCloseTo(52.5, 6);
    expect(nw!.lng).toBeCloseTo(16 + 50 / 60, 6);
    expect(ne!.lng).toBeCloseTo(17 + 20 / 60, 6);
    expect(se!.lat).toBeCloseTo(52.25, 6);
  });

  it('says so when nothing places the map; only for signed-in members', async () => {
    answer = reading({ sheetNumber: null, frameCorners: null, placeNames: [] });
    const none = await place();
    expect(none.status).toBe(422);
    expect(((await none.json()) as { error: string }).error).toMatch(/nazw/);
    expect((await place({}, null)).status).toBe(401);
    expect((await place({}, await signedInAs('stranger@example.com'))).status).toBe(401);
    expect((await place({ w: '9000' })).status).toBe(400);
  });
});
