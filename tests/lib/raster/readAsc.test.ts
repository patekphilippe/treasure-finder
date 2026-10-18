import { describe, expect, it } from 'vitest';
import { fillNodata, localRelief, readAsc, readGeoTiff, validZone } from '@/shared/lib/raster';

const enc = (s: string) => new TextEncoder().encode(s);

describe('readAsc', () => {
  it('reads xllcorner sheets with NODATA', () => {
    const g = readAsc(
      enc(
        'ncols 3\nnrows 2\nxllcorner 100\nyllcorner 200\ncellsize 1\nNODATA_value -9999\n1 2 3\n4 -9999 6\n',
      ),
    );
    expect(g).toMatchObject({ w: 3, h: 2, cell: 1, originE: 100, originN: 202 });
    expect(Array.from(g.dem.slice(0, 4))).toEqual([1, 2, 3, 4]);
    expect(Number.isNaN(g.dem[4]!)).toBe(true);
  });

  it('reads xllcenter (Geoportal style), lower-case keys and no NODATA line', () => {
    const g = readAsc(
      enc(
        'ncols 2\nnrows 2\nxllcenter 316617.00\nyllcenter 372171.00\ncellsize 1.00\n 140.25 140.5\n1.5e2 -0.25\n',
      ),
    );
    expect(g.originE).toBe(316616.5);
    expect(g.originN).toBe(372172.5); // yllcenter − ½ cell + 2 rows
    expect(Array.from(g.dem)).toEqual([140.25, 140.5, 150, -0.25]);
  });

  it('rejects truncated files and non-grid text', () => {
    expect(() =>
      readAsc(enc('ncols 2\nnrows 2\nxllcorner 0\nyllcorner 0\ncellsize 1\n1 2 3\n')),
    ).toThrow(/niepełny/);
    expect(() => readAsc(enc('hello world'))).toThrow(/ESRI ASCII/);
  });
});

describe('readGeoTiff', () => {
  it('reads a single-band EPSG:2180 GeoTIFF', async () => {
    const { writeArrayBuffer } = await import('geotiff');
    const buf = await writeArrayBuffer(new Float32Array([1, 2, 3, 4, 5, 6]), {
      width: 3,
      height: 2,
      ModelPixelScale: [0.5, 0.5, 0],
      ModelTiepoint: [0, 0, 0, 500000, 400000, 0],
      ProjectedCSTypeGeoKey: 2180,
      GTModelTypeGeoKey: 1,
      GTRasterTypeGeoKey: 1,
      SampleFormat: [3],
      BitsPerSample: [32],
    });
    const g = await readGeoTiff(buf as ArrayBuffer);
    expect(g).toMatchObject({ w: 3, h: 2, cell: 0.5, originE: 500000, originN: 400000 });
    expect(Array.from(g.dem)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('fillNodata / localRelief / validZone', () => {
  it('fills NODATA from neighbours and keeps a plane flat in the LRM', () => {
    const w = 40;
    const dem = new Float32Array(w * w);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) dem[y * w + x] = 100 + 0.1 * x;
    dem[5 * w + 5] = NaN;
    const filled = fillNodata(dem, w, w);
    expect(Math.abs(filled[5 * w + 5]! - 100.5)).toBeLessThanOrEqual(0.1); // a neighbour value
    const lrm = localRelief(filled, w, w, 5);
    expect(Math.abs(lrm[20 * w + 20]!)).toBeLessThan(1e-4);
    const ok = validZone(dem, w, w, 5);
    expect(ok[20 * w + 20]).toBe(1);
    expect(ok[5 * w + 8]).toBe(0); // within 5 cells of the NODATA cell
    expect(ok[2 * w + 20]).toBe(0); // edge
  });
});
