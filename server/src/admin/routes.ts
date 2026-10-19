import type { SourceObject, SubmissionResult, SubmissionStatus } from '@/shared/types/sources';
import { monthKey, spentThisMonth } from '../budget';
import { publishObjects } from '../context/packs';
import type { Env } from '../env';
import { fail, json } from '../http';

type Cors = Record<string, string>;
const KINDS: readonly string[] = ['osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne'];

/** Constant-time comparison of the bearer token with the ADMIN_TOKEN secret. */
export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 24 || !given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all(
    [given, env.ADMIN_TOKEN].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))),
  );
  return crypto.subtle.timingSafeEqual(a!, b!);
}

async function dropFiles(env: Env, id: string) {
  const files = await env.DB.prepare('SELECT r2_key FROM files WHERE submission_id = ?')
    .bind(id)
    .all<{ r2_key: string }>();
  if (files.results.length) await env.SOURCES.delete(files.results.map((f) => f.r2_key));
  await env.DB.prepare('DELETE FROM files WHERE submission_id = ?').bind(id).run();
}

/** Objects edited in the panel → only valid ones (kind, coordinates in Poland's area). */
function cleanObjects(raw: unknown): SourceObject[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((o: Record<string, unknown>) => {
    const lat = Number(o?.lat);
    const lng = Number(o?.lng);
    if (!KINDS.includes(String(o?.kind)) || !(lat > 48 && lat < 56 && lng > 13 && lng < 25))
      return [];
    return [
      {
        kind: o.kind as SourceObject['kind'],
        label: String(o.label ?? '').slice(0, 160),
        lat,
        lng,
        radiusM: Math.max(10, Math.min(5000, Number(o.radiusM) || 200)),
        confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0.5)),
        reasons: [],
      },
    ];
  });
}

export async function adminRoutes(
  request: Request,
  env: Env,
  path: string,
  cors: Cors,
  now: number,
) {
  if (!(await isAdmin(request, env))) return fail(401, 'Brak dostępu', cors);

  if (request.method === 'GET' && path === 'submissions') {
    const status = (new URL(request.url).searchParams.get('status') ??
      'do_przegladu') as SubmissionStatus;
    const rows = await env.DB.prepare(
      `SELECT s.id, s.mode, s.status, s.text, s.link, s.view_bbox, s.created_at, r.json AS result, r.cost_usd,
         (SELECT json_group_array(json_object('id', f.id, 'mime', f.mime)) FROM files f WHERE f.submission_id = s.id) AS files
       FROM submissions s LEFT JOIN results r ON r.submission_id = s.id
       WHERE s.status = ? ORDER BY s.created_at LIMIT 100`,
    )
      .bind(status)
      .all<Record<string, unknown>>();
    return json(
      rows.results.map((r) => ({
        ...r,
        view_bbox: r.view_bbox ? JSON.parse(String(r.view_bbox)) : null,
        result: r.result ? (JSON.parse(String(r.result)) as SubmissionResult) : null,
        files: JSON.parse(String(r.files ?? '[]')),
      })),
      200,
      cors,
    );
  }

  const file = /^files\/([A-Za-z0-9_-]+)$/.exec(path);
  if (request.method === 'GET' && file) {
    const row = await env.DB.prepare('SELECT r2_key, mime FROM files WHERE id = ?')
      .bind(file[1])
      .first<{ r2_key: string; mime: string }>();
    const obj = row ? await env.SOURCES.get(row.r2_key) : null;
    if (!obj || !row) return fail(404, 'Nie ma takiego pliku', cors);
    return new Response(obj.body, {
      headers: { ...cors, 'content-type': row.mime, 'cache-control': 'private, no-store' },
    });
  }

  if (request.method === 'GET' && path === 'budget') {
    return json(
      {
        month: monthKey(now),
        spentUsd: await spentThisMonth(env.DB, now),
        budgetUsd: Number(env.MONTHLY_BUDGET_USD),
      },
      200,
      cors,
    );
  }

  const action = /^submissions\/([A-Za-z0-9_-]+)\/(approve|reject)$/.exec(path);
  if (request.method === 'POST' && action) {
    const [, id, verb] = action;
    const row = await env.DB.prepare(
      'SELECT mode, status, consent_publish FROM submissions WHERE id = ?',
    )
      .bind(id)
      .first<{ mode: string; status: string; consent_publish: number }>();
    if (!row) return fail(404, 'Nie znaleziono zgłoszenia', cors);
    if (row.mode !== 'public' || row.status !== 'do_przegladu')
      return fail(409, 'Tego zgłoszenia nie można już zatwierdzić', cors);
    let published: string[] = [];
    if (verb === 'approve') {
      if (!row.consent_publish) return fail(409, 'Brak zgody na publikację', cors);
      const body = (await request.json().catch(() => null)) as {
        objects?: unknown;
        source?: unknown;
      } | null;
      const objects = cleanObjects(body?.objects);
      if (!objects.length) return fail(400, 'Brak obiektów do zatwierdzenia', cors);
      const source = String(body?.source ?? 'Wspólna baza źródeł').slice(0, 120);
      published = await publishObjects(env.CONTEXT, objects, source, now);
    }
    await dropFiles(env, id!);
    await env.DB.prepare('UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?')
      .bind(verb === 'approve' ? 'zatwierdzone' : 'odrzucone', now, id)
      .run();
    return json({ ok: true, published }, 200, cors);
  }
  return fail(404, 'Nie ma takiego adresu', cors);
}
