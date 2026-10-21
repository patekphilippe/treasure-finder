import type { Member } from '@/shared/types/community';
import { isOwnerEmail } from '../auth/isOwnerEmail';
import { randomToken } from '../crypto';
import type { Env } from '../env';
import { fail, json } from '../http';
import { consumeDaily } from '../submissions/dailyLimit';
import { memberFrom } from './auth';
import { communityMaps } from './maps';
import {
  cleanMoves,
  cleanRemovals,
  cleanObject,
  MAX_OBJECTS_PER_ANSWER,
  MEMBER_DAILY_WRITES,
  OBJECT_SELECT,
  parseBbox,
  toCommunityObject,
  type ObjectRow,
} from './objects';

type Cors = Record<string, string>;

/**
 * /api/community/…: the members-only shared base. Every request needs a signed-in member (Auth0);
 * members add objects that are visible at once, confirm or dispute others' and remove their own.
 */
export async function communityRoutes(
  request: Request,
  env: Env,
  path: string,
  cors: Cors,
  now: number,
) {
  const member = await memberFrom(request, env, now);
  if (!member) return fail(401, 'Zaloguj się kontem z zaproszeniem do społeczności', cors);
  const write = () => consumeDaily(env.DB, [`member:${member.id}`], MEMBER_DAILY_WRITES, now);

  if (path === 'maps' || path.startsWith('maps/'))
    return communityMaps(request, env, path, member, cors, now);

  if (request.method === 'GET' && path === 'me')
    return json(
      {
        name: member.name,
        email: member.email,
        owner: isOwnerEmail(member.email ?? '', env),
      } satisfies Member,
      200,
      cors,
    );

  if (request.method === 'GET' && path === 'objects') {
    const b = parseBbox(new URL(request.url).searchParams.get('bbox'));
    if (!b) return fail(400, 'Za duży albo błędny obszar, przybliż mapę', cors);
    const rows = await env.DB.prepare(
      `${OBJECT_SELECT},
         (SELECT vote FROM object_votes v WHERE v.object_id = o.id AND v.member_id = ?1) AS mine
       FROM community_objects o LEFT JOIN members m ON m.id = o.author_id
       WHERE o.removed_at IS NULL AND o.lat BETWEEN ?2 AND ?3 AND o.lng BETWEEN ?4 AND ?5
       LIMIT ${MAX_OBJECTS_PER_ANSWER}`,
    )
      .bind(member.id, b.south, b.north, b.west, b.east)
      .all<ObjectRow>();
    return json(
      rows.results.map((r) => toCommunityObject(r, member.id)),
      200,
      cors,
    );
  }

  if (request.method === 'POST' && path === 'objects') {
    const obj = cleanObject(await request.json().catch(() => null));
    if (!obj) return fail(400, 'Nieprawidłowy obiekt (rodzaj albo położenie poza Polską)', cors);
    if (!(await write()))
      return fail(429, 'Dzienny limit zmian został wykorzystany, spróbuj jutro', cors);
    const id = randomToken(12);
    await env.DB.prepare(
      `INSERT INTO community_objects (id, kind, label, lat, lng, radius_m, source, author_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, obj.kind, obj.label, obj.lat, obj.lng, obj.radiusM, obj.source, member.id, now, now)
      .run();
    return json({ id }, 201, cors);
  }

  // the author's objects follow their map placed better after reading (all in one write)
  if (request.method === 'POST' && path === 'objects/moves') {
    const moves = cleanMoves(await request.json().catch(() => null));
    if (!moves) return fail(400, 'Nieprawidłowe położenia (najwyżej 1000, w Polsce)', cors);
    if (!(await write()))
      return fail(429, 'Dzienny limit zmian został wykorzystany, spróbuj jutro', cors);
    const results = await env.DB.batch(
      moves.map((m) =>
        env.DB.prepare(
          `UPDATE community_objects SET lat = ?, lng = ?, updated_at = ?
           WHERE id = ? AND author_id = ? AND removed_at IS NULL`,
        ).bind(m.lat, m.lng, now, m.id, member.id),
      ),
    );
    return json({ moved: results.reduce((s, r) => s + (r.meta.changes ?? 0), 0) }, 200, cors);
  }

  // the author throws away a whole bad reading of their map (all in one write)
  if (request.method === 'POST' && path === 'objects/removals') {
    const ids = cleanRemovals(await request.json().catch(() => null));
    if (!ids) return fail(400, 'Nieprawidłowa lista obiektów (najwyżej 1000)', cors);
    if (!(await write()))
      return fail(429, 'Dzienny limit zmian został wykorzystany, spróbuj jutro', cors);
    const results = await env.DB.batch(
      ids.map((id) =>
        env.DB.prepare(
          `UPDATE community_objects SET removed_at = ?, updated_at = ?
           WHERE id = ? AND author_id = ? AND removed_at IS NULL`,
        ).bind(now, now, id, member.id),
      ),
    );
    return json({ removed: results.reduce((s, r) => s + (r.meta.changes ?? 0), 0) }, 200, cors);
  }

  const one = /^objects\/([A-Za-z0-9_-]+)(\/vote)?$/.exec(path);
  if (!one) return fail(404, 'Nie ma takiego adresu', cors);
  const [, id, vote] = one;
  const row = await env.DB.prepare(
    'SELECT author_id, removed_at FROM community_objects WHERE id = ?',
  )
    .bind(id)
    .first<{ author_id: string | null; removed_at: number | null }>();
  if (!row || row.removed_at) return fail(404, 'Nie ma takiego obiektu', cors);

  if (request.method === 'DELETE' && !vote) {
    if (row.author_id !== member.id)
      return fail(403, 'Usunąć może tylko autor albo właściciel', cors);
    if (!(await write()))
      return fail(429, 'Dzienny limit zmian został wykorzystany, spróbuj jutro', cors);
    await env.DB.prepare('UPDATE community_objects SET removed_at = ?, updated_at = ? WHERE id = ?')
      .bind(now, now, id)
      .run();
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method === 'POST' && vote) {
    const body = (await request.json().catch(() => null)) as {
      vote?: unknown;
      note?: unknown;
    } | null;
    const v = Number(body?.vote);
    if (![-1, 0, 1].includes(v)) return fail(400, 'Głos musi być 1, -1 albo 0', cors);
    if (row.author_id === member.id) return fail(403, 'Nie głosujesz na własny obiekt', cors);
    if (!(await write()))
      return fail(429, 'Dzienny limit zmian został wykorzystany, spróbuj jutro', cors);
    if (v === 0)
      await env.DB.prepare('DELETE FROM object_votes WHERE object_id = ? AND member_id = ?')
        .bind(id, member.id)
        .run();
    else
      await env.DB.prepare(
        `INSERT INTO object_votes (object_id, member_id, vote, note, created_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (object_id, member_id) DO UPDATE SET vote = excluded.vote, note = excluded.note, created_at = excluded.created_at`,
      )
        .bind(id, member.id, v, String(body?.note ?? '').slice(0, 300), now)
        .run();
    return new Response(null, { status: 204, headers: cors });
  }
  return fail(404, 'Nie ma takiego adresu', cors);
}
