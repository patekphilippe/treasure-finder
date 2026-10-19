import type { Env } from '../env';
import { fail } from '../http';

/**
 * The old public packs are gone: the shared base is for invited members only
 * (/api/community/objects). The packs were moved with POST /api/admin/migrate-packs.
 */
export function serveContext(_env: Env, _path: string, cors: Record<string, string>) {
  return fail(410, 'Wspólna baza jest teraz tylko dla członków społeczności', cors);
}
