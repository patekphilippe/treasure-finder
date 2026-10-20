import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildExportZip, importZip } from '@/shared/lib/io';
import type { OwnMap } from '@/shared/types/domain';
import v1 from '../../fixtures/kopia-v1.json';
import { makeOwnMap, makePoint, makeTrack } from '../../helpers/fixtures';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('importZip', () => {
  it('round-trips an export of this version without losses', async () => {
    const data = {
      points: [makePoint({ id: 'a', photoId: 'ph' }), makePoint({ id: 'b', status: 'pusto' })],
      tracks: [makeTrack({ id: 't', end: 5, segments: [[[52, 19, 1, 4]]] })],
      candidates: [],
      zones: [],
      context: [],
      maps: [
        makeOwnMap({ id: 'm', year: 1886, readAt: 1_700_000_000_000 }),
        makeOwnMap({ id: 'j', image: new Blob([jpeg], { type: 'image/jpeg' }) }),
      ],
    };
    const zip = await buildExportZip(data, new Map([['ph', new Blob([jpeg])]]), 0);
    const bundle = await importZip(await zip.generateAsync({ type: 'uint8array' }));

    expect(bundle.version).toBe(4);
    expect(bundle.points).toEqual(data.points);
    expect(bundle.tracks).toEqual(data.tracks);
    expect(new Uint8Array(await bundle.photos.get('ph')!.arrayBuffer())).toEqual(jpeg);
    // the same maps, each image with its type
    const typed = (maps: OwnMap[]) => maps.map((m) => ({ ...m, image: m.image.type }));
    expect(typed(bundle.maps)).toEqual(typed(data.maps));
    for (const [i, map] of bundle.maps.entries()) {
      expect(new Uint8Array(await map.image.arrayBuffer())).toEqual(
        new Uint8Array(await data.maps[i]!.image.arrayBuffer()),
      );
    }
    expect(bundle.skipped).toBe(0);
  });

  it('skips own maps whose image or placement is missing', async () => {
    const entry = { ...makeOwnMap({ id: 'm' }), image: 'mapy/m.webp' };
    const zip = new JSZip();
    zip.file(
      'kopia/kopia.json',
      JSON.stringify({
        wersja: 4,
        points: [],
        tracks: [],
        maps: [
          entry,
          { ...entry, id: 'gone', image: 'mapy/gone.webp' },
          { ...entry, id: 'bad', pixelToSource: [1, 2] },
        ],
      }),
    );
    zip.file('kopia/mapy/m.webp', new Uint8Array([1, 2, 3]));
    const bundle = await importZip(await zip.generateAsync({ type: 'uint8array' }));
    expect(bundle.maps.map((m) => m.id)).toEqual(['m']);
    expect(bundle.maps[0]!.image.type).toBe('image/webp');
    expect(bundle.skipped).toBe(2);
  });

  it('reads a version 1 backup with photos in zdjecia/<photo>.jpg', async () => {
    const zip = new JSZip();
    zip.file('kopia.json', JSON.stringify(v1));
    zip.file('zdjecia/ph-v1-1.jpg', jpeg);
    zip.file('zdjecia/unused.jpg', jpeg);
    const bundle = await importZip(await zip.generateAsync({ type: 'uint8array' }));

    expect(bundle.points).toHaveLength(2);
    expect(bundle.tracks).toHaveLength(1);
    expect([...bundle.photos.keys()]).toEqual(['ph-v1-1']);
  });

  it('finds kopia.json inside a folder', async () => {
    const zip = new JSZip();
    zip.file('eksport/kopia.json', JSON.stringify(v1));
    const bundle = await importZip(await zip.generateAsync({ type: 'uint8array' }));
    expect(bundle.points).toHaveLength(2);
  });

  it('explains a missing kopia.json', async () => {
    const zip = new JSZip();
    zip.file('punkty.geojson', '{}');
    await expect(importZip(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(
      /kopia.json/,
    );
  });

  it('explains a file that is not a ZIP', async () => {
    await expect(importZip(new Uint8Array([1, 2, 3]))).rejects.toThrow(/ZIP/);
  });
});
