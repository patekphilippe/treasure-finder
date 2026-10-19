import type {
  SubmissionCreated,
  SubmissionResult,
  SubmissionStatus,
  SubmissionView,
} from '@/shared/types/sources';
import { randomToken, sha256Hex } from '../crypto';
import type { Env } from '../env';
import { fail, json } from '../http';
import { consumeDaily } from './dailyLimit';
import { PUBLIC_DAILY_LIMIT } from './limits';
import { parseSubmission } from './parseSubmission';
import { verifyTurnstile } from './verifyTurnstile';

type Cors = Record<string, string>;

interface SubmissionRow {
  id: string;
  mode: 'public' | 'private';
  status: SubmissionStatus;
  access_key_hash: string;
  created_at: number;
  error: string | null;
}

/** IP hashed together with the day: enough to count requests, useless for tracking a person. */
async function ipSubject(request: Request, now: number): Promise<{ ip: string; subject: string }> {
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const day = new Date(now).toISOString().slice(0, 10);
  return { ip, subject: `ip:${(await sha256Hex(`${day}|${ip}`)).slice(0, 32)}` };
}

export async function createSubmission(request: Request, env: Env, cors: Cors, now: number) {
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Nieprawidłowe zgłoszenie', cors);
  const parsed = parseSubmission(form);
  if ('error' in parsed) return fail(400, parsed.error, cors);

  const { ip, subject } = await ipSubject(request, now);
  if (!(await verifyTurnstile(parsed.turnstileToken, env.TURNSTILE_SECRET, ip)))
    return fail(403, 'Weryfikacja nie powiodła się, spróbuj jeszcze raz', cors);

  const allowed =
    parsed.mode === 'private'
      ? await consumeDaily(
          env.DB,
          [`device:${parsed.deviceId}`, subject],
          Number(env.PRIVATE_DAILY_LIMIT),
          now,
        )
      : await consumeDaily(env.DB, [`public:${subject}`], PUBLIC_DAILY_LIMIT, now);
  if (!allowed) return fail(429, 'Dzienny limit analiz został wykorzystany, spróbuj jutro', cors);

  const id = randomToken(12);
  const accessKey = randomToken(24);
  const files = await Promise.all(
    parsed.files.map(async (file) => {
      const fileId = randomToken(9);
      const r2Key = `zgloszenia/${id}/${fileId}`;
      await env.SOURCES.put(r2Key, file.stream(), { httpMetadata: { contentType: file.type } });
      return { fileId, r2Key, mime: file.type, bytes: file.size };
    }),
  );
  const status: SubmissionStatus = 'nowe';
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO submissions (id, mode, status, access_key_hash, device_id, ip_hash, text, link,
         view_bbox, consent_publish, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      parsed.mode,
      status,
      await sha256Hex(accessKey),
      parsed.deviceId,
      subject,
      parsed.text,
      parsed.link,
      parsed.viewBbox ? JSON.stringify(parsed.viewBbox) : null,
      parsed.consentPublish ? 1 : 0,
      now,
      now,
    ),
    ...files.map((f) =>
      env.DB.prepare(
        'INSERT INTO files (id, submission_id, r2_key, mime, bytes) VALUES (?, ?, ?, ?, ?)',
      ).bind(f.fileId, id, f.r2Key, f.mime, f.bytes),
    ),
  ]);
  const body: SubmissionCreated = { id, accessKey, status };
  return json(body, 201, cors);
}

/** The row when `key` opens it, otherwise null (same answer for a wrong id and a wrong key). */
async function authorised(env: Env, id: string, key: string | null): Promise<SubmissionRow | null> {
  if (!key) return null;
  const row = await env.DB.prepare(
    'SELECT id, mode, status, access_key_hash, created_at, error FROM submissions WHERE id = ?',
  )
    .bind(id)
    .first<SubmissionRow>();
  if (!row || row.access_key_hash !== (await sha256Hex(key))) return null;
  return row;
}

export async function getSubmission(env: Env, id: string, key: string | null, cors: Cors) {
  const row = await authorised(env, id, key);
  if (!row) return fail(404, 'Nie znaleziono zgłoszenia', cors);
  const result = await env.DB.prepare('SELECT json FROM results WHERE submission_id = ?')
    .bind(id)
    .first<{ json: string }>();
  const view: SubmissionView = {
    id: row.id,
    mode: row.mode,
    status: row.status,
    createdAt: row.created_at,
    result: result ? (JSON.parse(result.json) as SubmissionResult) : null,
    error: row.error,
  };
  return json(view, 200, cors);
}

export async function deleteSubmission(env: Env, id: string, key: string | null, cors: Cors) {
  const row = await authorised(env, id, key);
  if (!row) return fail(404, 'Nie znaleziono zgłoszenia', cors);
  const files = await env.DB.prepare('SELECT r2_key FROM files WHERE submission_id = ?')
    .bind(id)
    .all<{ r2_key: string }>();
  if (files.results.length) await env.SOURCES.delete(files.results.map((f) => f.r2_key));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM results WHERE submission_id = ?').bind(id),
    env.DB.prepare('DELETE FROM files WHERE submission_id = ?').bind(id),
    env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id),
  ]);
  return new Response(null, { status: 204, headers: cors });
}
