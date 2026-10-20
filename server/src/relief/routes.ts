import type { Env } from '../env';
import { fail } from '../http';
import { ipSubject } from '../ipSubject';
import { consumeDaily } from '../submissions/dailyLimit';
import {
  RELIEF_ALL_DAILY,
  RELIEF_BOUNDS,
  RELIEF_IP_DAILY,
  RELIEF_JPEG_QUALITY,
  RELIEF_MAX_ZOOM,
  RELIEF_MIN_ZOOM,
  RELIEF_TILE_PX,
  RELIEF_VERSION,
} from './config';
import { demWindow, tileBounds } from './demWindow';
import { encodeGrayAlphaPng } from './encodeGrayAlphaPng';
import { encodeGrayJpeg } from './encodeGrayJpeg';
import { fetchDem } from './fetchDem';
import { shadeTile, type ShadedTile } from './shadeTile';

const TILE_PATH = /^(\d+)\/(\d+)\/(\d+)\/(\d+)$/;
/** open data, the same for everyone: any page may draw it, also on a canvas */
const OPEN = { 'access-control-allow-origin': '*' };

const tileResponse = (body: BodyInit, type: string) =>
  new Response(body, {
    headers: {
      ...OPEN,
      'content-type': type,
      // the version is in the URL: a tile never changes
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });

async function encode(t: ShadedTile): Promise<{ bytes: Uint8Array; type: string }> {
  if (t.empty)
    return {
      bytes: await encodeGrayAlphaPng(new Uint8Array(1), new Uint8Array(1), 1, 1),
      type: 'image/png',
    };
  if (!t.alpha)
    return {
      bytes: encodeGrayJpeg(t.gray, RELIEF_TILE_PX, RELIEF_TILE_PX, RELIEF_JPEG_QUALITY),
      type: 'image/jpeg',
    };
  return {
    bytes: await encodeGrayAlphaPng(t.gray, t.alpha, RELIEF_TILE_PX, RELIEF_TILE_PX),
    type: 'image/png',
  };
}

/**
 * GET /api/relief/{version}/{z}/{x}/{y}: our hillshade of the GUGiK NMT as a 512 px map tile.
 * Rendered once (heights from the WCS, ~2 s), kept in R2 and served from there afterwards.
 * New tiles count against daily limits; stored ones are free.
 */
export async function serveRelief(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  path: string,
  now: number,
): Promise<Response> {
  const m = TILE_PATH.exec(path);
  const [v, z, x, y] = (m?.slice(1) ?? []).map(Number) as [number, number, number, number];
  if (
    !m ||
    v !== RELIEF_VERSION ||
    z < RELIEF_MIN_ZOOM ||
    z > RELIEF_MAX_ZOOM ||
    x >= 2 ** z ||
    y >= 2 ** z
  )
    return fail(404, 'Nie ma takiego kafelka', OPEN);
  const b = tileBounds(z, x, y);
  if (
    b.east < RELIEF_BOUNDS.west ||
    b.west > RELIEF_BOUNDS.east ||
    b.north < RELIEF_BOUNDS.south ||
    b.south > RELIEF_BOUNDS.north
  )
    return fail(404, 'Kafelek poza zasięgiem NMT', OPEN);

  const key = `relief/${v}/${z}/${x}/${y}`;
  const stored = await env.TILES?.get(key);
  if (stored) return tileResponse(stored.body, stored.httpMetadata?.contentType ?? 'image/jpeg');

  const { subject } = await ipSubject(request, now);
  const allowed =
    (await consumeDaily(env.DB, [`relief:${subject}`], RELIEF_IP_DAILY, now)) &&
    (await consumeDaily(env.DB, ['relief:all'], RELIEF_ALL_DAILY, now));
  if (!allowed) return fail(429, 'Dzienny limit nowych kafelków cieniowania wyczerpany', OPEN);

  const win = demWindow(z, x, y);
  let dem: Float32Array;
  try {
    dem = await fetchDem(win, env.NMT_WCS_URL || undefined);
  } catch (e) {
    console.warn(`relief ${z}/${x}/${y}: ${e instanceof Error ? e.message : String(e)}`);
    return fail(503, 'Geoportal nie podał wysokości, spróbuj za chwilę', {
      ...OPEN,
      'retry-after': '5',
    });
  }
  const { bytes, type } = await encode(shadeTile(win, dem));
  if (env.TILES) ctx.waitUntil(env.TILES.put(key, bytes, { httpMetadata: { contentType: type } }));
  return tileResponse(bytes, type);
}
