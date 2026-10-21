import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { SharedMap } from '@/shared/types/community';
import { invitedMember, signedInAs } from './signIn';

const worker = (exports as unknown as { default: Fetcher }).default;
const call = (path: string, auth: string | null, init: RequestInit = {}) =>
  worker.fetch(
    new Request(`https://api.test/api/community/${path}`, {
      ...init,
      headers: auth ? { authorization: auth } : {},
    }),
  );
const meta = (patch: Record<string, unknown> = {}) => ({
  name: 'Messtischblatt 5260',
  year: 1921,
  width: 4000,
  height: 3000,
  pixelToSource: [2, 0, 300000, 0, -2, 400000, 0, 0, 1],
  epsg: 2180,
  method: 'corners',
  ...patch,
});
const scan = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4]);
const put = (id: string, auth: string, m: Record<string, unknown>, image = true) => {
  const body = new FormData();
  body.append('meta', JSON.stringify(m));
  if (image) body.append('image', new File([scan], 'mapa.webp', { type: 'image/webp' }));
  return call(`maps/${id}`, auth, { method: 'PUT', body });
};

describe('maps shared with the community', () => {
  it('one member shares, everyone sees and downloads it, only the author changes it', async () => {
    const anna = await invitedMember(worker, 'Anna');
    const bartek = await invitedMember(worker, 'Bartek');
    const id = 'map-11111111';
    const created = await put(id, anna, meta());
    expect(created.status).toBe(201);

    const seen = (await (await call('maps', bartek)).json()) as SharedMap[];
    expect(seen.find((m) => m.id === id)).toMatchObject({
      name: 'Messtischblatt 5260',
      year: 1921,
      author: 'Anna',
      mine: false,
      readAt: null,
      mime: 'image/webp',
      bytes: scan.length,
    });
    const image = await call(`maps/${id}/image`, bartek);
    expect(image.headers.get('content-type')).toBe('image/webp');
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(scan);

    expect((await put(id, bartek, meta({ name: 'Moja' }))).status).toBe(403);
    expect((await call(`maps/${id}`, bartek, { method: 'DELETE' })).status).toBe(403);

    // the author moves the corners and notes the AI reading: no new upload needed
    const moved = await put(id, anna, meta({ year: 1936, readAt: 1_700_000_000_000 }), false);
    expect(moved.status).toBe(200);
    expect((await moved.json()) as SharedMap).toMatchObject({
      year: 1936,
      readAt: 1_700_000_000_000,
      mine: true,
    });

    expect((await call(`maps/${id}`, anna, { method: 'DELETE' })).status).toBe(204);
    expect(
      ((await (await call('maps', bartek)).json()) as SharedMap[]).some((m) => m.id === id),
    ).toBe(false);
    expect((await call(`maps/${id}/image`, bartek)).status).toBe(404);
  });

  it('the owner may remove any map; bad data and strangers are refused', async () => {
    const anna = await invitedMember(worker, 'Anna');
    const owner = await signedInAs('owner@example.com');
    await put('map-22222222', anna, meta());
    expect((await call('maps/map-22222222', owner, { method: 'DELETE' })).status).toBe(204);

    expect((await put('map-33333333', anna, meta({ pixelToSource: [1, 2] }))).status).toBe(400);
    expect((await put('map-44444444', anna, meta(), false)).status).toBe(400);
    expect((await call('maps', null)).status).toBe(401);
    expect((await call('maps', await signedInAs('stranger@example.com'))).status).toBe(401);
  });
});
