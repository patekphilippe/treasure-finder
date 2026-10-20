import { PUBLISH_MIN_CONFIDENCE, type SourceObject } from '@/shared/types/sources';
import { randomToken } from '../crypto';
import type { Env } from '../env';

const KINDS: readonly string[] = ['osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne'];

/** Objects → only valid ones (kind, coordinates in Poland's area), with sane radius and confidence. */
export function validObjects(raw: unknown): SourceObject[] {
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

/** The submission's files go: from KV and from the database. */
export async function dropFiles(env: Env, id: string): Promise<void> {
  const files = await env.DB.prepare('SELECT r2_key FROM files WHERE submission_id = ?')
    .bind(id)
    .all<{ r2_key: string }>();
  await Promise.all(files.results.map((f) => env.SOURCES.delete(f.r2_key)));
  await env.DB.prepare('DELETE FROM files WHERE submission_id = ?').bind(id).run();
}

/**
 * A public submission into the shared base: its objects without an author, the photos deleted,
 * status 'zatwierdzone'. Used by the owner's approval and, in the test phase, for what an admin
 * shares (runPipeline). Returns how many objects were published.
 */
export async function publishSubmission(
  env: Env,
  id: string,
  objects: readonly SourceObject[],
  source: string,
  now: number,
): Promise<number> {
  if (objects.length)
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
  await dropFiles(env, id);
  await env.DB.prepare('UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?')
    .bind('zatwierdzone', now, id)
    .run();
  return objects.length;
}

/** What an admin shares in the test phase: the objects the panel would have ticked by default. */
export const autoPublished = (objects: unknown) =>
  validObjects(objects).filter((o) => o.confidence >= PUBLISH_MIN_CONFIDENCE);
