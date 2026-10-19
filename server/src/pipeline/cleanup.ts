import type { Env } from '../env';

/** Private submissions live 30 days (the app promises it in SOURCES_PRIVACY_NOTE). */
export const PRIVATE_TTL_MS = 30 * 86_400_000;

/** Deletes expired private submissions with their files and results; returns how many. */
export async function deleteExpired(env: Env, now: number): Promise<number> {
  const old = (
    await env.DB.prepare(
      `SELECT id FROM submissions WHERE mode = 'private' AND created_at < ? LIMIT 200`,
    )
      .bind(now - PRIVATE_TTL_MS)
      .all<{ id: string }>()
  ).results;
  for (const { id } of old) {
    const files = await env.DB.prepare('SELECT r2_key FROM files WHERE submission_id = ?')
      .bind(id)
      .all<{ r2_key: string }>();
    await Promise.all(files.results.map((f) => env.SOURCES.delete(f.r2_key)));
    await env.DB.batch([
      env.DB.prepare('DELETE FROM results WHERE submission_id = ?').bind(id),
      env.DB.prepare('DELETE FROM files WHERE submission_id = ?').bind(id),
      env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id),
    ]);
  }
  return old.length;
}
