import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyExclusion, exclusionRequests, fetchExclusionMask } from '@/shared/lib/tiles';

const g = { originE: 400_000, originN: 500_000, res: 1, w: 40, h: 40 };

/** RGBA of a mw × mh image with one opaque pixel at (x, y) */
function onePixel(mw: number, mh: number, x: number, y: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(mw * mh * 4);
  rgba[(y * mw + x) * 4 + 3] = 255;
  return rgba;
}

describe('BDOT10k exclusion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('one bit per group; returns the cells it covers', () => {
    const [build, roads] = exclusionRequests(g);
    expect([build!.bit, roads!.bit]).toEqual([1, 2]);
    const mask = new Uint8Array(g.w * g.h);
    const a = applyExclusion(mask, onePixel(40, 40, 5, 5), build!, g);
    const b = applyExclusion(mask, onePixel(40, 40, 38, 38), roads!, g);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(mask[5 * 40 + 5]).toBe(1);
    expect(mask[38 * 40 + 38]).toBe(2);
    expect(applyExclusion(new Uint8Array(1600), new Uint8ClampedArray(1600 * 4), roads!, g)).toBe(
      0,
    );
  });

  it('reports each group: ok with its share, empty, or error when the answer is unusable', async () => {
    const images: Record<string, Uint8ClampedArray> = {
      BudGo: onePixel(40, 40, 20, 20),
      JDrLNUt: new Uint8ClampedArray(40 * 40 * 4),
    };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('LAYERS=rz')) return new Response('<ServiceException/>', { status: 500 });
      const key = Object.keys(images).find((k) => url.includes(`LAYERS=${k}`))!;
      return new Response(new Blob([key]), { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', async (b: Blob) => ({ key: await b.text(), close() {} }));
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        private key = '';
        getContext() {
          return {
            drawImage: (bm: { key: string }) => (this.key = bm.key),
            getImageData: () => ({ data: images[this.key]! }),
          };
        }
      },
    );
    const { mask, groups } = await fetchExclusionMask(g.originE, g.originN, 1, 40, 40);
    expect(groups.map((x) => x.status)).toEqual(['ok', 'empty', 'error']);
    expect(groups[0]!.share).toBeGreaterThan(0);
    expect(groups[0]!.share).toBeLessThanOrEqual(1);
    expect(mask[20 * 40 + 20]).toBe(1);
  });

  it('offline: every group is an error and nothing is excluded', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    const { mask, groups } = await fetchExclusionMask(g.originE, g.originN, 1, 40, 40);
    expect(groups.every((x) => x.status === 'error')).toBe(true);
    expect(mask.some((v) => v)).toBe(false);
  });
});
