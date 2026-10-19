import type { Env } from '../env';
import { fail } from '../http';
import { INDEX_KEY } from './packs';

/** Public, read-only: the index and the packs of approved context, cached for an hour. */
export async function serveContext(env: Env, path: string, cors: Record<string, string>) {
  const key = path === 'index.json' ? INDEX_KEY : `kontekst/${path}`;
  if (!/^kontekst\/(index\.json|-?\d+\.\d{2}_-?\d+\.\d{2}\.geojson)$/.test(key))
    return fail(404, 'Nie ma takiej paczki', cors);
  const obj = await env.CONTEXT.get(key);
  if (!obj)
    return key === INDEX_KEY
      ? new Response('[]', { headers: { ...cors, 'content-type': 'application/json' } })
      : fail(404, 'Nie ma takiej paczki', cors);
  return new Response(obj.body, {
    headers: {
      ...cors,
      'content-type': obj.httpMetadata?.contentType ?? 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  });
}
