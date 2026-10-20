import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RELIEF_IP_DAILY } from '../src/relief/config';

const worker = (exports as unknown as { default: Fetcher }).default;
const tile = (path: string, ip = '203.0.113.7') =>
  worker.fetch(
    new Request(`https://api.test/api/relief/${path}`, { headers: { 'cf-connecting-ip': ip } }),
  );
const bindings = env as unknown as { DB: D1Database; TILES: R2Bucket };

// z14 tile over Karpacz, z12 tile on the German border at Zgorzelec
const KARPACZ = '1/14/8909/5501';
const ZGORZELEC = '1/12/2218/1368';

/** Float32 TIFF, one strip, as the GUGiK WCS answers. */
function floatTiff(w: number, h: number, height: (x: number, y: number) => number): ArrayBuffer {
  const tags: [number, number, number][] = [
    [256, 4, w],
    [257, 4, h],
    [258, 3, 32],
    [259, 3, 1],
    [273, 4, 0],
    [277, 3, 1],
    [278, 4, h],
    [279, 4, w * h * 4],
    [339, 3, 3],
  ];
  const dataAt = 8 + 2 + tags.length * 12 + 4;
  const buf = new ArrayBuffer(dataAt + w * h * 4);
  const v = new DataView(buf);
  v.setUint16(0, 0x4949);
  v.setUint16(2, 42, true);
  v.setUint32(4, 8, true);
  v.setUint16(8, tags.length, true);
  tags.forEach(([tag, type, value], i) => {
    const at = 10 + i * 12;
    v.setUint16(at, tag, true);
    v.setUint16(at + 2, type, true);
    v.setUint32(at + 4, 1, true);
    if (type === 3) v.setUint16(at + 8, value, true);
    else v.setUint32(at + 8, tag === 273 ? dataAt : value, true);
  });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) v.setFloat32(dataAt + (y * w + x) * 4, height(x, y), true);
  return buf;
}

/** The WCS: answers the size asked in SCALESIZE with the given terrain. */
function wcs(height: (x: number, y: number) => number) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = decodeURIComponent(String(input instanceof Request ? input.url : input));
    const [, w, h] = /SCALESIZE=x\((\d+)\),y\((\d+)\)/.exec(url) ?? [];
    return new Response(floatTiff(Number(w), Number(h), height), {
      headers: { 'content-type': 'image/tiff' },
    });
  });
}

const hills = (x: number, y: number) => 500 + 20 * Math.sin(x / 9) * Math.cos(y / 13);

describe('relief tiles', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const listed = await bindings.TILES.list();
    await Promise.all(listed.objects.map((o) => bindings.TILES.delete(o.key)));
  });
  afterEach(() => vi.restoreAllMocks());

  it('refuses other versions, zooms outside 12–16 and tiles outside Poland', async () => {
    const fetchSpy = wcs(hills);
    for (const path of [
      '2/14/8909/5501',
      '1/11/1113/687',
      '1/17/71266/44032',
      '1/14/99999/5501',
      '1/12/2048/1300',
      'x/y',
    ])
      expect((await tile(path)).status, path).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('renders a JPEG from the WCS heights once, then serves it from R2', async () => {
    const fetchSpy = wcs(hills);
    const first = await tile(KARPACZ);
    expect(first.status).toBe(200);
    expect(first.headers.get('content-type')).toBe('image/jpeg');
    expect(first.headers.get('cache-control')).toContain('immutable');
    expect(first.headers.get('access-control-allow-origin')).toBe('*');
    const bytes = new Uint8Array(await first.arrayBuffer());
    expect([bytes[0], bytes[1], bytes.at(-2), bytes.at(-1)]).toEqual([0xff, 0xd8, 0xff, 0xd9]);

    // the WCS was asked in EPSG:2180 metres (x easting, y northing) at the tile's pixel size
    const asked = decodeURIComponent(String(fetchSpy.mock.calls[0]![0]));
    const [, e0, e1] = /SUBSET=x\(([\d.]+),([\d.]+)\)/.exec(asked)!.map(Number);
    const [, n0, n1] = /SUBSET=y\(([\d.]+),([\d.]+)\)/.exec(asked)!.map(Number);
    expect(e0).toBeGreaterThan(260_000);
    expect(e1).toBeLessThan(285_000);
    expect(n0).toBeGreaterThan(320_000);
    expect(n1).toBeLessThan(340_000);
    expect(asked).toContain('INTERPOLATION=AVERAGE');

    await vi.waitFor(async () =>
      expect(await bindings.TILES.head('relief/1/14/8909/5501')).not.toBeNull(),
    );
    const again = await tile(KARPACZ);
    expect(again.status).toBe(200);
    expect(new Uint8Array(await again.arrayBuffer())).toEqual(bytes);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('leaves missing heights transparent: a PNG with alpha, an empty one for the sea', async () => {
    // the WCS answers 0 m outside Poland: here the western half of the window
    wcs((x, y) => (x < 270 ? 0 : hills(x, y)));
    const border = await tile(ZGORZELEC);
    expect(border.headers.get('content-type')).toBe('image/png');
    const png = new Uint8Array(await border.arrayBuffer());
    expect(png[25]).toBe(4); // colour type: grey + alpha

    vi.restoreAllMocks();
    wcs(() => 0);
    const sea = await tile('1/12/2270/1300');
    expect(sea.headers.get('content-type')).toBe('image/png');
    expect((await sea.arrayBuffer()).byteLength).toBeLessThan(100);
  });

  it('answers 503 and stores nothing while the WCS fails', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('<ows:ExceptionReport/>', { status: 400 }));
    const res = await tile(KARPACZ);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(await bindings.TILES.head('relief/1/14/8909/5501')).toBeNull();
  });

  it('counts only newly rendered tiles against the daily limit of an IP', async () => {
    wcs(hills);
    const day = new Date().toISOString().slice(0, 10);
    // the same day-hashed subject as ipSubject() for this IP
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${day}|198.51.100.9`),
    );
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    await bindings.DB.prepare('INSERT INTO daily_usage (day, subject, count) VALUES (?, ?, ?)')
      .bind(day, `relief:ip:${hex.slice(0, 32)}`, RELIEF_IP_DAILY)
      .run();
    expect((await tile(KARPACZ, '198.51.100.9')).status).toBe(429);
    // another IP renders it; the stored tile is then free for everyone
    expect((await tile(KARPACZ, '203.0.113.50')).status).toBe(200);
    await vi.waitFor(async () =>
      expect(await bindings.TILES.head('relief/1/14/8909/5501')).not.toBeNull(),
    );
    expect((await tile(KARPACZ, '198.51.100.9')).status).toBe(200);
  });
});
