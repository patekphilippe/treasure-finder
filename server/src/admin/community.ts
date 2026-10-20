import type { AdminCommunityObject, AdminMember } from '@/shared/types/community';
import type { SourceObject } from '@/shared/types/sources';
import { cleanEmail } from '@/shared/lib/cleanEmail';
import { unusedCodeHash } from '../community/auth';
import { OBJECT_SELECT, type ObjectRow } from '../community/objects';
import { randomToken } from '../crypto';
import type { Env } from '../env';
import { fail, json } from '../http';
import { INDEX_KEY, type PackIndexEntry } from '../context/packs';

type Cors = Record<string, string>;

/** Approved objects of a public submission go to the shared base without an author. */
export async function insertApproved(
  env: Env,
  objects: readonly SourceObject[],
  source: string,
  now: number,
): Promise<number> {
  await env.DB.batch(
    objects.map((o) =>
      env.DB.prepare(
        `INSERT INTO community_objects (id, kind, label, lat, lng, radius_m, source, author_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      ).bind(
        randomToken(12),
        o.kind,
        o.label,
        o.lat,
        o.lng,
        Math.round(o.radiusM),
        source,
        now,
        now,
      ),
    ),
  );
  return objects.length;
}

/** Owner's part of the community: invitations by e-mail, blocking, moderation, moving the old packs. */
export async function adminCommunity(
  request: Request,
  env: Env,
  path: string,
  cors: Cors,
  now: number,
): Promise<Response | null> {
  if (request.method === 'POST' && path === 'members') {
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      email?: unknown;
    } | null;
    const name = String(body?.name ?? '')
      .trim()
      .slice(0, 60);
    const email = cleanEmail(body?.email);
    if (!name) return fail(400, 'Podaj imię albo pseudonim', cors);
    if (!email) return fail(400, 'Podaj adres e-mail konta, którym ta osoba się zaloguje', cors);
    const id = randomToken(9);
    // the invitation is the address: the first sign-in with it takes this member
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO members (id, name, token_hash, blocked, created_at, email) VALUES (?, ?, ?, 0, ?, ?)',
    )
      .bind(id, name, await unusedCodeHash(), now, email)
      .run();
    if (!res.meta.changes) return fail(409, 'Ten adres jest już zaproszony', cors);
    return json({ id, name, email }, 201, cors);
  }

  // a member from the code days gets an address; a changed one frees the member for the new account
  const address = /^members\/([A-Za-z0-9_-]+)\/email$/.exec(path);
  if (request.method === 'POST' && address) {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = cleanEmail(body?.email);
    if (!email) return fail(400, 'Nieprawidłowy adres e-mail', cors);
    const taken = await env.DB.prepare('SELECT 1 FROM members WHERE email = ? AND id != ?')
      .bind(email, address[1])
      .first();
    if (taken) return fail(409, 'Ten adres ma już inna osoba', cors);
    const res = await env.DB.prepare(
      'UPDATE members SET auth_sub = CASE WHEN email = ?1 THEN auth_sub END, email = ?1 WHERE id = ?2',
    )
      .bind(email, address[1])
      .run();
    if (!res.meta.changes) return fail(404, 'Nie ma takiej osoby', cors);
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET' && path === 'members') {
    const rows = await env.DB.prepare(
      `SELECT m.id, m.name, m.email, m.auth_sub IS NOT NULL AS linked, m.blocked, m.created_at, m.last_seen_day,
         (SELECT count(*) FROM community_objects o WHERE o.author_id = m.id AND o.removed_at IS NULL) AS objects,
         (SELECT count(*) FROM object_votes v WHERE v.member_id = m.id) AS votes
       FROM members m ORDER BY m.created_at`,
    ).all<{
      id: string;
      name: string;
      email: string | null;
      linked: number;
      blocked: number;
      created_at: number;
      last_seen_day: string | null;
      objects: number;
      votes: number;
    }>();
    return json(
      rows.results.map((r): AdminMember => ({
        id: r.id,
        name: r.name,
        email: r.email,
        linked: Boolean(r.linked),
        blocked: Boolean(r.blocked),
        createdAt: r.created_at,
        lastSeenDay: r.last_seen_day,
        objects: r.objects,
        votes: r.votes,
      })),
      200,
      cors,
    );
  }

  const block = /^members\/([A-Za-z0-9_-]+)\/(block|unblock)$/.exec(path);
  if (request.method === 'POST' && block) {
    const res = await env.DB.prepare('UPDATE members SET blocked = ? WHERE id = ?')
      .bind(block[2] === 'block' ? 1 : 0, block[1])
      .run();
    if (!res.meta.changes) return fail(404, 'Nie ma takiej osoby', cors);
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET' && path === 'objects') {
    const filter = new URL(request.url).searchParams.get('filter') ?? 'recent';
    const where =
      filter === 'removed'
        ? 'o.removed_at IS NOT NULL'
        : filter === 'disputed'
          ? 'o.removed_at IS NULL AND down - up >= 2'
          : 'o.removed_at IS NULL';
    const rows = await env.DB.prepare(
      `SELECT * FROM (${OBJECT_SELECT},
          (SELECT json_group_array(v.note) FROM object_votes v WHERE v.object_id = o.id AND v.vote = -1 AND v.note != '') AS notes
        FROM community_objects o LEFT JOIN members m ON m.id = o.author_id) o
       WHERE ${where} ORDER BY o.created_at DESC LIMIT 200`,
    ).all<ObjectRow & { removed_at: number | null; notes: string }>();
    return json(
      rows.results.map((r): AdminCommunityObject => ({
        id: r.id,
        kind: r.kind,
        label: r.label,
        lat: r.lat,
        lng: r.lng,
        radiusM: r.radius_m,
        source: r.source,
        author: r.author,
        createdAt: r.created_at,
        up: r.up,
        down: r.down,
        removedAt: r.removed_at,
        notes: JSON.parse(r.notes ?? '[]') as string[],
      })),
      200,
      cors,
    );
  }

  const moderate = /^objects\/([A-Za-z0-9_-]+)\/(remove|restore)$/.exec(path);
  if (request.method === 'POST' && moderate) {
    const res = await env.DB.prepare(
      'UPDATE community_objects SET removed_at = ?, updated_at = ? WHERE id = ?',
    )
      .bind(moderate[2] === 'remove' ? now : null, now, moderate[1])
      .run();
    if (!res.meta.changes) return fail(404, 'Nie ma takiego obiektu', cors);
    return json({ ok: true }, 200, cors);
  }

  // one-off: the old public packs (Workers KV) into the members-only base; repeated runs add nothing
  if (request.method === 'POST' && path === 'migrate-packs') {
    const index = (await env.CONTEXT.get<PackIndexEntry[]>(INDEX_KEY, 'json')) ?? [];
    let moved = 0;
    for (const entry of index) {
      const pack = await env.CONTEXT.get<{
        features: {
          geometry: { coordinates: [number, number] };
          properties: {
            kind: SourceObject['kind'];
            label: string;
            radiusM: number;
            source: string;
            approved: number;
          };
        }[];
      }>(entry.key, 'json');
      for (const f of pack?.features ?? []) {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        const exists = await env.DB.prepare(
          'SELECT 1 FROM community_objects WHERE kind = ? AND lat = ? AND lng = ? AND author_id IS NULL',
        )
          .bind(p.kind, lat, lng)
          .first();
        if (exists) continue;
        await env.DB.prepare(
          `INSERT INTO community_objects (id, kind, label, lat, lng, radius_m, source, author_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        )
          .bind(
            randomToken(12),
            p.kind,
            p.label ?? '',
            lat,
            lng,
            Math.round(p.radiusM ?? 200),
            p.source ?? '',
            p.approved ?? now,
            now,
          )
          .run();
        moved++;
      }
    }
    return json({ moved }, 200, cors);
  }
  return null;
}
