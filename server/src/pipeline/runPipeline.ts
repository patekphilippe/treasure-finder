import type {
  SourceObject,
  SubmissionResult,
  SubmissionStatus,
  ViewBbox,
} from '@/shared/types/sources';
import { addSpending, spentThisMonth } from '../budget';
import type { Env } from '../env';
import type { AiClient, BatchOutcome, BatchRequest } from './aiClient';
import { objectFromText, objectsFromMap } from './assemble';
import { findPlaces, growBbox } from './gazetteer';
import { placeMap } from './placeMap';
import { deleteExpired } from './cleanup';
import { costUsd, estimateUsd, FIRST_MODEL, SECOND_MODEL, type PipelineModel } from './pricing';
import { parseMapReading, parseTextReading, squareReading } from './readings';
import { imageSize } from './imageSize';
import { mapRequest, parseCustomId, textRequest } from './requests';

interface Row {
  id: string;
  mode: 'public' | 'private';
  status: SubmissionStatus;
  text: string | null;
  link: string | null;
  view_bbox: string | null;
  model: PipelineModel;
  anthropic_files: string | null;
  batch_id: string | null;
}
interface FileRow {
  id: string;
  r2_key: string;
  mime: string;
}

const POLAND: ViewBbox = { south: 49.0, west: 14.1, north: 54.9, east: 24.2 };
/** submissions sent in one cron run (keeps the run short and the batch small) */
const PER_RUN = 40;

/** Files sent to Anthropic for the current batch: their id and height ÷ width. */
interface UploadedFile {
  id: string;
  aspect: number;
}
/** Older rows kept just the id. */
function readUploads(json: string | null): Record<string, UploadedFile> {
  const raw = JSON.parse(json ?? '{}') as Record<string, string | UploadedFile>;
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? { id: v, aspect: 1 } : v]),
  );
}

const viewOf = (row: Row): ViewBbox | null =>
  row.view_bbox ? (JSON.parse(row.view_bbox) as ViewBbox) : null;

async function setStatus(
  db: D1Database,
  id: string,
  status: SubmissionStatus,
  now: number,
  extra = '',
) {
  await db
    .prepare(`UPDATE submissions SET status = ?, updated_at = ?${extra} WHERE id = ?`)
    .bind(status, now, id)
    .run();
}

/** Cron step 1: new submissions → one batch, as far as the monthly budget allows. */
export async function submitNew(env: Env, ai: AiClient, now: number): Promise<number> {
  const budget = Number(env.MONTHLY_BUDGET_USD);
  const rows = (
    await env.DB.prepare(
      `SELECT * FROM submissions WHERE status IN ('nowe', 'czeka_na_budzet') ORDER BY created_at LIMIT ?`,
    )
      .bind(PER_RUN)
      .all<Row>()
  ).results;
  if (!rows.length) return 0;

  // batches still running are not in the spending yet: count them at their estimate
  const inFlight = await env.DB.prepare(
    `SELECT s.model, COUNT(f.id) AS images, LENGTH(COALESCE(s.text, '')) AS chars
     FROM submissions s LEFT JOIN files f ON f.submission_id = s.id
     WHERE s.status = 'w_kolejce' GROUP BY s.id`,
  ).all<{ model: PipelineModel; images: number; chars: number }>();
  let committed =
    (await spentThisMonth(env.DB, now)) +
    inFlight.results.reduce((s, r) => s + estimateUsd(r.model, r.images, r.chars), 0);

  const requests: BatchRequest[] = [];
  const sent: { id: string; files: Record<string, UploadedFile> }[] = [];
  for (const row of rows) {
    const files = (
      await env.DB.prepare('SELECT id, r2_key, mime FROM files WHERE submission_id = ?')
        .bind(row.id)
        .all<FileRow>()
    ).results;
    if (!files.length && !row.text) {
      // only a link: nothing for the model to read, it goes straight to review
      await finish(
        env,
        row,
        { summary: 'Zgłoszono link do źródła', objects: [], georef: null },
        now,
      );
      continue;
    }
    const estimate = estimateUsd(row.model, files.length, row.text?.length ?? 0);
    if (committed + estimate > budget) {
      if (row.status !== 'czeka_na_budzet') await setStatus(env.DB, row.id, 'czeka_na_budzet', now);
      continue;
    }
    committed += estimate;
    const uploaded: Record<string, UploadedFile> = {};
    for (const f of files) {
      const body = await env.SOURCES.get(f.r2_key, 'arrayBuffer');
      if (!body) continue;
      // only the header is read: height ÷ width turns image fractions into square units
      const size = imageSize(new Uint8Array(body, 0, Math.min(body.byteLength, 64 * 1024)));
      const id = await ai.uploadFile(`${row.id}-${f.id}`, f.mime, body);
      uploaded[f.id] = { id, aspect: size ? size.h / size.w : 1 };
      requests.push(mapRequest(row.id, f.id, id, f.mime, viewOf(row), row.model));
    }
    if (row.text) requests.push(textRequest(row.id, row.text, row.link, row.model));
    sent.push({ id: row.id, files: uploaded });
  }
  if (!requests.length) return 0;

  const batchId = await ai.createBatch(requests);
  await env.DB.batch(
    sent.map((s) =>
      env.DB.prepare(
        `UPDATE submissions SET status = 'w_kolejce', batch_id = ?, anthropic_files = ?, updated_at = ? WHERE id = ?`,
      ).bind(batchId, JSON.stringify(s.files), now, s.id),
    ),
  );
  return sent.length;
}

async function finish(env: Env, row: Row, result: SubmissionResult, now: number) {
  const status: SubmissionStatus = row.mode === 'private' ? 'gotowe' : 'do_przegladu';
  await env.DB.batch([
    env.DB.prepare(
      'INSERT OR REPLACE INTO results (submission_id, model, json, cost_usd, created_at) VALUES (?, ?, ?, COALESCE((SELECT cost_usd FROM results WHERE submission_id = ?), 0), ?)',
    ).bind(row.id, row.model, JSON.stringify(result), row.id, now),
    env.DB.prepare(
      'UPDATE submissions SET status = ?, batch_id = NULL, anthropic_files = NULL, updated_at = ? WHERE id = ?',
    ).bind(status, now, row.id),
  ]);
}

/** Cron step 2: finished batches → placed objects, spending, next status. */
export async function collectFinished(env: Env, ai: AiClient, now: number): Promise<number> {
  const batches = (
    await env.DB.prepare(
      `SELECT DISTINCT batch_id FROM submissions WHERE status = 'w_kolejce'`,
    ).all<{
      batch_id: string;
    }>()
  ).results;
  let done = 0;
  for (const { batch_id } of batches) {
    if (!(await ai.batchEnded(batch_id))) continue;
    const bySubmission = new Map<string, BatchOutcome[]>();
    for (const o of await ai.batchResults(batch_id)) {
      const { submissionId } = parseCustomId(o.customId);
      bySubmission.set(submissionId, [...(bySubmission.get(submissionId) ?? []), o]);
    }
    const rows = (
      await env.DB.prepare(`SELECT * FROM submissions WHERE batch_id = ? AND status = 'w_kolejce'`)
        .bind(batch_id)
        .all<Row>()
    ).results;
    for (const row of rows) {
      await processOne(env, ai, row, bySubmission.get(row.id) ?? [], now);
      done++;
    }
  }
  return done;
}

async function processOne(env: Env, ai: AiClient, row: Row, outcomes: BatchOutcome[], now: number) {
  const cost = outcomes.reduce((s, o) => s + (o.usage ? costUsd(row.model, o.usage, true) : 0), 0);
  await addSpending(env.DB, now, cost);
  const uploads = readUploads(row.anthropic_files);
  for (const u of Object.values(uploads)) await ai.deleteFile(u.id);

  const ok = outcomes.filter((o) => o.json !== null);
  if (!ok.length) {
    await setStatus(
      env.DB,
      row.id,
      'blad',
      now,
      ", error = 'Analiza się nie udała', batch_id = NULL",
    );
    return;
  }
  const view = viewOf(row);
  const summaries: string[] = [];
  const objects: SourceObject[] = [];
  let georef: SubmissionResult['georef'] = null;
  let hard = false;

  for (const o of ok) {
    const { fileId } = parseCustomId(o.customId);
    if (fileId !== null) {
      const reading = squareReading(parseMapReading(o.json), uploads[fileId]?.aspect ?? 1);
      if (reading.summary) summaries.push(reading.summary);
      const placement = await placeMap(env, reading, view, now);
      const meanConfidence = reading.objects.length
        ? reading.objects.reduce((s, x) => s + x.confidence, 0) / reading.objects.length
        : 1;
      hard ||=
        reading.legibility === 'slaba' ||
        meanConfidence < 0.5 ||
        (!placement && reading.objects.length > 0);
      if (placement) {
        georef = {
          method: placement.method,
          rmsM: placement.rmsM,
          ...(placement.anchors ? { anchors: placement.anchors } : {}),
        };
        objects.push(...objectsFromMap(reading, placement));
      } else if (reading.objects.length) {
        const names = reading.placeNames.slice(0, 8).map((p) => p.text);
        summaries.push(
          `Mapa ma ${reading.objects.length} obiektów, ale nie udało się jej umieścić na dzisiejszej mapie: potrzebne ręczne dopasowanie.` +
            (names.length
              ? ` Odczytane nazwy: ${names.join(', ')}.`
              : ' Nie odczytano nazw miejscowości.'),
        );
      }
    } else {
      const reading = parseTextReading(o.json);
      if (reading.summary) summaries.push(reading.summary);
      const area = view ? growBbox(view, 30) : POLAND;
      for (const item of reading.items) {
        const [anchor] = await findPlaces(env.DB, item.anchor, area, now);
        if (anchor) objects.push(objectFromText(item, anchor));
      }
    }
  }

  // costs are kept per submission so the review panel can show them
  await env.DB.prepare(
    'INSERT INTO results (submission_id, model, json, cost_usd, created_at) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT (submission_id) DO UPDATE SET cost_usd = cost_usd + excluded.cost_usd',
  )
    .bind(row.id, row.model, '{}', cost, now)
    .run();

  if (hard && row.model === FIRST_MODEL) {
    // one more careful reading by the stronger model in the next run
    await setStatus(
      env.DB,
      row.id,
      'nowe',
      now,
      `, model = '${SECOND_MODEL}', batch_id = NULL, anthropic_files = NULL`,
    );
    return;
  }
  await finish(env, row, { summary: summaries.join(' '), objects, georef }, now);
}

export async function runPipeline(env: Env, ai: AiClient, now: number) {
  const collected = await collectFinished(env, ai, now);
  const submitted = await submitNew(env, ai, now);
  const deleted = await deleteExpired(env, now);
  return { collected, submitted, deleted };
}
