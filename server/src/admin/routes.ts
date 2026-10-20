import type { SubmissionResult, SubmissionStatus } from '@/shared/types/sources';
import { monthKey, spentThisMonth } from '../budget';
import { isOwnerEmail } from '../auth/isOwnerEmail';
import { signedIn } from '../auth/session';
import { sameSecret } from '../crypto';
import type { Env } from '../env';
import { bearer, fail, json } from '../http';
import { dropFiles, publishSubmission, validObjects } from '../submissions/publish';
import { adminCommunity } from './community';

type Cors = Record<string, string>;

/** The owner: signed in with an address from ADMIN_EMAILS, or (scripts, curl) the ADMIN_TOKEN secret. */
export async function isAdmin(request: Request, env: Env, now: number): Promise<boolean> {
  const who = await signedIn(request, env, now);
  if (who) return isOwnerEmail(who.email, env);
  return sameSecret(bearer(request), env.ADMIN_TOKEN);
}

export async function adminRoutes(
  request: Request,
  env: Env,
  path: string,
  cors: Cors,
  now: number,
) {
  if (!(await isAdmin(request, env, now))) return fail(401, 'Brak dostępu', cors);

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
    const obj = row ? await env.SOURCES.get(row.r2_key, 'stream') : null;
    if (!obj || !row) return fail(404, 'Nie ma takiego pliku', cors);
    return new Response(obj, {
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
    if (verb === 'reject') {
      await dropFiles(env, id!);
      await env.DB.prepare('UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?')
        .bind('odrzucone', now, id)
        .run();
      return json({ ok: true, published: 0 }, 200, cors);
    }
    if (!row.consent_publish) return fail(409, 'Brak zgody na publikację', cors);
    const body = (await request.json().catch(() => null)) as {
      objects?: unknown;
      source?: unknown;
    } | null;
    const objects = validObjects(body?.objects);
    if (!objects.length) return fail(400, 'Brak obiektów do zatwierdzenia', cors);
    const source = String(body?.source ?? 'Wspólna baza źródeł').slice(0, 120);
    // the members-only base (D1); the old public packs are no longer written
    const published = await publishSubmission(env, id!, objects, source, now);
    return json({ ok: true, published }, 200, cors);
  }
  const community = await adminCommunity(request, env, path, cors, now);
  if (community) return community;
  return fail(404, 'Nie ma takiego adresu', cors);
}
