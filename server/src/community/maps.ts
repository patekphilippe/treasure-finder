import { normalizeMapEntry } from '@/shared/lib/io/normalizeMapEntry';
import type { SharedMap } from '@/shared/types/community';
import { isOwnerEmail } from '../auth/isOwnerEmail';
import type { Env } from '../env';
import { fail, json } from '../http';
import { consumeDaily } from '../submissions/dailyLimit';
import type { MemberRow } from './auth';

type Cors = Record<string, string>;

/** an own map is at most ~16 Mpx (WebP 0.9): a few MB, well under this */
export const MAX_MAP_BYTES = 30 * 1024 * 1024;
const MAP_MIME: readonly string[] = ['image/webp', 'image/jpeg', 'image/png'];
/** new scans a member may upload a day */
const UPLOADS_PER_DAY = 30;
const key = (id: string) => `mapy/${id}`;

interface MapRow {
  id: string;
  name: string;
  year: number | null;
  width: number;
  height: number;
  pixel_to_source: string;
  epsg: number;
  method: SharedMap['method'];
  mime: string;
  bytes: number;
  author_id: string;
  author: string | null;
  read_at: number | null;
  updated_at: number;
}

const SELECT = `SELECT s.*, m.name AS author FROM shared_maps s LEFT JOIN members m ON m.id = s.author_id`;

const toShared = (r: MapRow, memberId: string): SharedMap => ({
  id: r.id,
  name: r.name,
  year: r.year,
  width: r.width,
  height: r.height,
  pixelToSource: JSON.parse(r.pixel_to_source) as number[],
  epsg: r.epsg,
  method: r.method,
  mime: r.mime,
  bytes: r.bytes,
  author: r.author,
  mine: r.author_id === memberId,
  readAt: r.read_at,
  updatedAt: r.updated_at,
});

/**
 * /api/community/maps…: own maps shared with the members. The scan lies in R2, the placement in
 * D1. Everyone in the community lists and downloads them; the author (and the owner) changes and
 * removes them.
 */
export async function communityMaps(
  request: Request,
  env: Env,
  path: string,
  member: MemberRow,
  cors: Cors,
  now: number,
): Promise<Response> {
  const store = env.TILES;
  if (!store) return fail(503, 'Magazyn map nie jest skonfigurowany', cors);

  if (request.method === 'GET' && path === 'maps') {
    const rows = await env.DB.prepare(
      `${SELECT} WHERE s.removed_at IS NULL ORDER BY s.created_at`,
    ).all<MapRow>();
    return json(
      rows.results.map((r) => toShared(r, member.id)),
      200,
      cors,
    );
  }

  const m = /^maps\/([A-Za-z0-9_-]{6,64})(\/image)?$/.exec(path);
  if (!m) return fail(404, 'Nie ma takiego adresu', cors);
  const [, id, image] = m as unknown as [string, string, string | undefined];
  const row = await env.DB.prepare(`${SELECT} WHERE s.id = ? AND s.removed_at IS NULL`)
    .bind(id)
    .first<MapRow>();

  if (request.method === 'GET' && image) {
    const obj = row ? await store.get(key(id)) : null;
    if (!row || !obj) return fail(404, 'Nie ma takiej mapy', cors);
    return new Response(obj.body, {
      headers: { ...cors, 'content-type': row.mime, 'cache-control': 'private, no-cache' },
    });
  }
  if (image) return fail(405, 'Nieobsługiwane zapytanie', cors);

  const mayEdit = !row || row.author_id === member.id || isOwnerEmail(member.email ?? '', env);

  if (request.method === 'DELETE') {
    if (!row) return fail(404, 'Nie ma takiej mapy', cors);
    if (!mayEdit) return fail(403, 'Mapę usuwa tylko jej autor', cors);
    await store.delete(key(id));
    await env.DB.prepare('UPDATE shared_maps SET removed_at = ?, updated_at = ? WHERE id = ?')
      .bind(now, now, id)
      .run();
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'PUT') return fail(405, 'Nieobsługiwane zapytanie', cors);
  if (!mayEdit) return fail(403, 'Mapę zmienia tylko jej autor', cors);
  const form = await request.formData().catch(() => null);
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(form?.get('meta') ?? ''));
  } catch {
    // checked below
  }
  // the same checks as an own map read back from a backup (the image comes separately)
  const meta = normalizeMapEntry({ ...(raw as object), id, image: 'upload' });
  if (!form || !meta) return fail(400, 'Nieprawidłowe dane mapy', cors);
  const file = form.get('image');
  if (!row && !(file instanceof File)) return fail(400, 'Brak obrazu mapy', cors);
  let mime = row?.mime ?? '';
  let bytes = row?.bytes ?? 0;
  if (file instanceof File) {
    if (!MAP_MIME.includes(file.type))
      return fail(400, 'Obraz mapy musi być w WebP, JPEG albo PNG', cors);
    if (file.size > MAX_MAP_BYTES) return fail(413, 'Obraz mapy jest za duży (do 30 MB)', cors);
    if (!(await consumeDaily(env.DB, [`maps:member:${member.id}`], UPLOADS_PER_DAY, now)))
      return fail(429, 'Dzienny limit wysyłania map został wykorzystany, spróbuj jutro', cors);
    // R2 wants a known length: the scan is a few MB, read whole
    await store.put(key(id), await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    mime = file.type;
    bytes = file.size;
  }
  await env.DB.prepare(
    `INSERT INTO shared_maps (id, name, year, width, height, pixel_to_source, epsg, method, mime, bytes,
       author_id, read_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
     ON CONFLICT (id) DO UPDATE SET name = ?2, year = ?3, width = ?4, height = ?5,
       pixel_to_source = ?6, epsg = ?7, method = ?8, mime = ?9, bytes = ?10,
       read_at = COALESCE(?12, read_at), updated_at = ?13, removed_at = NULL`,
  )
    .bind(
      id,
      meta.name.slice(0, 120),
      meta.year ?? null,
      meta.width,
      meta.height,
      JSON.stringify(meta.pixelToSource),
      meta.epsg,
      meta.method,
      mime,
      bytes,
      member.id,
      meta.readAt ?? null,
      now,
    )
    .run();
  const saved = await env.DB.prepare(`${SELECT} WHERE s.id = ?`).bind(id).first<MapRow>();
  return json(toShared(saved!, member.id), row ? 200 : 201, cors);
}
