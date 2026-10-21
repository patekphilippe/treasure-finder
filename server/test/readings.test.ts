import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapReading } from '@/shared/types/readings';
import { addSpending, spentThisMonth } from '../src/budget';
import { READ_MEMBER_DAILY_LIMIT } from '../src/readings/limits';
import { signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
const db = (env as unknown as { DB: D1Database }).DB;
const ORIGIN = 'https://patekphilippe.github.io';
let device = 0;
// a signed-in member for each test (beforeEach)
let reader: string;

const view = () =>
  new File([new Uint8Array([255, 216, 255, 0])], 'widok.jpg', { type: 'image/jpeg' });
function read(fields: Record<string, string | File> = {}, auth: string | null = reader) {
  const body = new FormData();
  const all: Record<string, string | File> = {
    image: view(),
    w: '800',
    h: '600',
    res: '1.5',
    model: 'claude-haiku-5-5',
    ...fields,
  };
  for (const [k, v] of Object.entries(all)) body.append(k, v);
  return worker.fetch(
    new Request('https://api.test/api/readings', {
      method: 'POST',
      body,
      headers: { origin: ORIGIN, ...(auth ? { authorization: auth } : {}) },
    }),
  );
}

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

describe('view readings', () => {
  let claude: () => Response;
  let sent: {
    model: string;
    output_config: unknown;
    messages: { content: { type: string; text?: string; source?: { media_type: string } }[] }[];
  } | null;

  beforeEach(async () => {
    device++;
    reader = await member(`Reader${device}`);
    sent = null;
    claude = () =>
      Response.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              objects: [
                { kind: 'mlyn', label: 'Mühle', x: 120, y: 80, confidence: 0.9 },
                { kind: 'budynek', label: '', x: 9999, y: 5, confidence: 0.9 },
              ],
            }),
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 2000, output_tokens: 400 },
      });
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith('https://api.anthropic.com/v1/messages')) {
        sent = JSON.parse(String(init?.body));
        return claude();
      }
      throw new Error(`unexpected fetch ${url}`);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('reads a view with the shared prompt and schema, keeps objects inside the image', async () => {
    const before = await spentThisMonth(db, Date.now());
    const res = await read();
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const body = (await res.json()) as MapReading;
    expect(body.objects).toEqual([
      { kind: 'mlyn', label: 'Mühle', x: 120, y: 80, confidence: 0.9 },
    ]);
    expect(body.usage).toEqual({ inputTokens: 2000, outputTokens: 400 });
    expect(sent!.model).toBe('claude-haiku-5-5');
    expect(sent!.output_config).toMatchObject({ format: { type: 'json_schema' } });
    expect(sent!.messages[0]!.content[0]!.source!.media_type).toBe('image/jpeg');
    expect(sent!.messages[0]!.content[1]!.text).toMatch(/800 × 600 pixels.*1 pixel = 1\.5 m/s);
    // Haiku without batch discount: (2000 × 0.1 + 400 × 0.5) / 1e6
    expect((await spentThisMonth(db, Date.now())) - before).toBeCloseTo(0.0004, 8);
  });

  it('reads a military map with its own prompt, schema and length; lines come back', async () => {
    claude = () =>
      Response.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              objects: [
                {
                  kind: 'linia_frontu',
                  label: '52 A',
                  x: 400,
                  y: 300,
                  line: [
                    { x: 10, y: 10 },
                    { x: 790, y: 590 },
                  ],
                  confidence: 0.8,
                },
                { kind: 'mlyn', label: '', x: 5, y: 5, line: [], confidence: 0.9 },
              ],
            }),
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 2000, output_tokens: 900 },
      });
    const res = await read({ profile: 'wojskowa', res: '6' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as MapReading;
    // a mill is no military kind: it stays, as "inne"
    expect(body.objects.map((o) => o.kind)).toEqual(['linia_frontu', 'inne']);
    expect(body.objects[0]!.line).toHaveLength(2);
    expect(sent!.messages[0]!.content[1]!.text).toMatch(/Second World War military map/);
    expect(JSON.stringify(sent!.output_config)).toContain('linia_frontu');
    expect((sent as unknown as { max_tokens: number }).max_tokens).toBe(8192);
    expect((await read({ profile: 'kataster' })).status).toBe(400);
  });

  it('reads a 1:100 000 sheet with its legend; no catch-all kind for place names', async () => {
    claude = () =>
      Response.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              objects: [
                { kind: 'karczma', label: 'Whs. z. Hoffnung', x: 5, y: 5, confidence: 0.8 },
                { kind: 'inne', label: 'Reppersdorf', x: 9, y: 9, confidence: 0.9 },
              ],
            }),
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 2000, output_tokens: 300 },
      });
    const res = await read({ profile: 'arkusz100', res: '8' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as MapReading;
    // a kind outside the legend is dropped, not turned into a pin
    expect(body.objects.map((o) => o.kind)).toEqual(['karczma']);
    expect(sent!.messages[0]!.content[1]!.text).toMatch(/1:100 000 topographic sheet/);
    expect(JSON.stringify(sent!.output_config)).not.toContain('"inne"');
  });

  it('refuses anyone not signed in with an invitation, and bad input', async () => {
    const anonymous = await read({}, null);
    expect(anonymous.status).toBe(401);
    expect(((await anonymous.json()) as { error: string }).error).toMatch(/Zaloguj się/);
    expect((await read({}, 'Bearer not-a-real-token-0000000')).status).toBe(401);
    expect((await read({}, await signedInAs('stranger@example.com'))).status).toBe(401);
    expect((await read({ model: 'gpt-9' })).status).toBe(400);
    expect((await read({ w: '5000' })).status).toBe(400);
    const pdf = new File([new Uint8Array([1])], 'x.pdf', { type: 'application/pdf' });
    expect((await read({ image: pdf })).status).toBe(400);
    expect(sent).toBeNull();
  });

  it('has a daily limit per member', async () => {
    const { id } = (await db
      .prepare('SELECT id FROM members WHERE email = ?')
      .bind(`reader${device}@example.com`)
      .first<{ id: string }>())!;
    await db
      .prepare('INSERT INTO daily_usage (day, subject, count) VALUES (?, ?, ?)')
      .bind(new Date().toISOString().slice(0, 10), `read:member:${id}`, READ_MEMBER_DAILY_LIMIT - 1)
      .run();
    expect((await read()).status).toBe(200);
    const over = await read();
    expect(over.status).toBe(429);
    expect(((await over.json()) as { error: string }).error).toMatch(/limit odczytów/);
    // another member still reads
    expect((await read({}, await member(`Other${device}`))).status).toBe(200);
  });

  it('stops before the call when the monthly budget would be passed', async () => {
    await addSpending(db, Date.now(), 4.999);
    const res = await read();
    expect(res.status).toBe(503);
    expect(sent).toBeNull();
    // the database is shared by the tests of this file: give the budget back
    await addSpending(db, Date.now(), -4.999);
  });

  it('a busy model and a refusal become clear messages; tokens used are still counted', async () => {
    claude = () => new Response('{}', { status: 529 });
    expect((await read()).status).toBe(503);
    claude = () =>
      Response.json({
        content: [],
        stop_reason: 'refusal',
        usage: { input_tokens: 1500, output_tokens: 3 },
      });
    const before = await spentThisMonth(db, Date.now());
    const refused = await read();
    expect(refused.status).toBe(422);
    expect(await spentThisMonth(db, Date.now())).toBeGreaterThan(before);
  });
});
