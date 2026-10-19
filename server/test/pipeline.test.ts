import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubmissionCreated, SubmissionView } from '@/shared/types/sources';
import { addSpending } from '../src/budget';
import type { Env } from '../src/env';
import type { AiClient, BatchOutcome, BatchRequest } from '../src/pipeline/aiClient';
import { parseCustomId } from '../src/pipeline/requests';
import { runPipeline } from '../src/pipeline/runPipeline';

const worker = (exports as unknown as { default: Fetcher }).default;
const testEnv = env as unknown as Env;
let n = 0;

/** Fake Anthropic: records what was sent, answers with what the test scripts. */
function fakeAi(answer: (req: BatchRequest) => unknown) {
  const batches = new Map<string, BatchRequest[]>();
  const uploaded: string[] = [];
  const deleted: string[] = [];
  const client: AiClient = {
    uploadFile: async (name) => {
      uploaded.push(name);
      return `file_${name}`;
    },
    deleteFile: async (id) => {
      deleted.push(id);
    },
    createBatch: async (requests) => {
      const id = `batch_${batches.size + 1}_${n}`;
      batches.set(id, requests);
      return id;
    },
    batchEnded: async () => true,
    batchResults: async (id): Promise<BatchOutcome[]> =>
      batches.get(id)!.map((r) => ({
        customId: r.custom_id,
        json: answer(r),
        usage: { input_tokens: 3000, output_tokens: 1000 },
        error: null,
      })),
  };
  return { client, batches, uploaded, deleted };
}

async function submit(
  fields: Record<string, string>,
  withPhoto: boolean,
): Promise<SubmissionCreated> {
  const body = new FormData();
  body.append('mode', 'private');
  body.append('deviceId', `pipeline-device-${n}-abcdef`);
  body.append('turnstile', 'tok');
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  if (withPhoto)
    body.append('files', new File([new Uint8Array([1, 2, 3])], 'm.jpg', { type: 'image/jpeg' }));
  const res = await worker.fetch(
    new Request('https://api.test/api/submissions', {
      method: 'POST',
      body,
      headers: { 'cf-connecting-ip': `10.0.0.${n}` },
    }),
  );
  return (await res.json()) as SubmissionCreated;
}

const view = async (c: SubmissionCreated) =>
  (await (
    await worker.fetch(new Request(`https://api.test/api/submissions/${c.id}?key=${c.accessKey}`))
  ).json()) as SubmissionView;

const sheetReading = (legibility: string) => ({
  summary: 'Messtischblatt 4968 Breslau',
  series: 'messtischblatt',
  year: 1936,
  sheetNumber: '4968',
  legibility,
  frameCorners: { nw: { x: 0, y: 0 }, ne: { x: 1, y: 0 }, se: { x: 1, y: 1 }, sw: { x: 0, y: 1 } },
  placeNames: [],
  objects: [{ kind: 'mlyn', label: 'Wassermühle', x: 0.5, y: 0.5, confidence: 0.8 }],
});

describe('AI pipeline', () => {
  beforeEach(() => {
    n++;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('turnstile')) return Response.json({ success: true });
      if (url.includes('nominatim')) {
        const q = new URL(url).searchParams.get('q');
        if (q === 'Kowary')
          return Response.json([
            { lat: '50.7920', lon: '15.8350', display_name: 'Kowary, powiat' },
          ]);
        return Response.json([]);
      }
      throw new Error(`unexpected fetch ${url}`);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('reads a map photo in a batch, places it by sheet number and returns the mill', async () => {
    const c = await submit({}, true);
    const ai = fakeAi(() => sheetReading('dobra'));
    const first = await runPipeline(testEnv, ai.client, Date.now());
    expect(first.submitted).toBe(1);
    const [requests] = [...ai.batches.values()];
    expect(requests).toHaveLength(1);
    const req = requests![0]!;
    expect(parseCustomId(req.custom_id).submissionId).toBe(c.id);
    expect(req.params.model).toBe('claude-haiku-5-5');
    expect(req.params.output_config?.format?.type).toBe('json_schema');
    expect((await view(c)).status).toBe('w_kolejce');

    await runPipeline(testEnv, ai.client, Date.now());
    const v = await view(c);
    expect(v.status).toBe('gotowe');
    expect(v.result?.georef).toEqual({ method: 'arkusz', rmsM: null });
    const mill = v.result!.objects[0]!;
    expect(mill.kind).toBe('mlyn');
    expect(mill.lat).toBeCloseTo(51.05, 6);
    expect(mill.lng).toBeCloseTo(17.0833, 3);
    expect(ai.deleted).toHaveLength(1);
  });

  it('gives a hard map a second, careful reading by Sonnet', async () => {
    const c = await submit({}, true);
    const ai = fakeAi((r) =>
      sheetReading(r.params.model === 'claude-haiku-5-5' ? 'slaba' : 'srednia'),
    );
    await runPipeline(testEnv, ai.client, Date.now()); // send (Haiku)
    await runPipeline(testEnv, ai.client, Date.now()); // collect → hard → send again (Sonnet)
    expect((await view(c)).status).toBe('w_kolejce');
    const models = [...ai.batches.values()]
      .flat()
      .filter((r) => r.custom_id.startsWith(c.id))
      .map((r) => r.params.model);
    expect(models).toEqual(['claude-haiku-5-5', 'claude-sonnet-5-5']);
    await runPipeline(testEnv, ai.client, Date.now());
    expect((await view(c)).status).toBe('gotowe');
  });

  it('locates a mill from a written description through the gazetteer', async () => {
    const c = await submit(
      { text: 'Za kościołem w Kowarach, 300 kroków na północ, stał młyn.' },
      false,
    );
    const ai = fakeAi(() => ({
      summary: 'Wspomnienie o młynie',
      objects: [
        {
          kind: 'mlyn',
          label: 'stał młyn',
          anchor: 'Kowary',
          anchorKind: 'miejscowosc',
          direction: 'N',
          distanceM: 300,
          confidence: 0.6,
        },
      ],
    }));
    await runPipeline(testEnv, ai.client, Date.now());
    await runPipeline(testEnv, ai.client, Date.now());
    const v = await view(c);
    expect(v.status).toBe('gotowe');
    expect(v.result!.objects[0]).toMatchObject({ kind: 'mlyn', radiusM: 150 });
    expect(v.result!.objects[0]!.lat).toBeGreaterThan(50.792);
  });

  it('holds new work once the monthly budget is spent', async () => {
    const c = await submit({ text: 'karczma przy brodzie' }, false);
    await addSpending(testEnv.DB, Date.now(), 5);
    const ai = fakeAi(() => ({ summary: '', objects: [] }));
    const r = await runPipeline(testEnv, ai.client, Date.now());
    expect(r.submitted).toBe(0);
    expect(ai.batches.size).toBe(0);
    expect((await view(c)).status).toBe('czeka_na_budzet');
  });
});
