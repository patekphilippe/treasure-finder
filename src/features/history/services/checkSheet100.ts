import type { ImageGrid, MapObject, ReadKind } from '@/shared/lib/history';
import type { AiModelId } from '../config/aiReading';
import { readMapWithAi, type AiUsage } from './readMapWithAi';

/** the close-up: this many pixels of the view around the spot (~1 km at 8 m a pixel)… */
const CROP_PX = 128;
/** …enlarged this much, so a small symbol and a name's letters are told apart */
const ZOOM = 3;
/** the confirmed symbol must be this close to the centre (share of the close-up's side) */
const NEAR_CENTRE = 0.2;
/** close-ups asked at once */
const PARALLEL = 3;

/**
 * The second look of a 1:100 000 reading: each spot cut out of the view, enlarged and read again
 * on its own (profile arkusz100_sprawdz). Only spots where the same kind is confirmed at the
 * centre stay, moved onto the symbol found there; a village name read as a place is not
 * confirmed. A daily limit or an exhausted budget stops it; other failures drop the spot.
 */
export async function checkSheet100(
  view: Blob,
  grid: ImageGrid,
  spots: readonly MapObject<ReadKind>[],
  model: AiModelId,
  legend?: string | null,
): Promise<{ confirmed: MapObject<ReadKind>[]; usage: AiUsage }> {
  const usage: AiUsage = { inputTokens: 0, outputTokens: 0 };
  if (!spots.length) return { confirmed: [], usage };
  const bitmap = await createImageBitmap(view);
  const side = CROP_PX * ZOOM;
  const confirmed: (MapObject<ReadKind> | null)[] = [];
  let stopped: Error | null = null;

  const check = async (spot: MapObject<ReadKind>): Promise<MapObject<ReadKind> | null> => {
    const x0 = spot.x - CROP_PX / 2;
    const y0 = spot.y - CROP_PX / 2;
    const canvas = new OffscreenCanvas(side, side);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, x0, y0, CROP_PX, CROP_PX, 0, 0, side, side);
    const image = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    try {
      const r = await readMapWithAi(
        image,
        side,
        side,
        grid.res / ZOOM,
        model,
        'arkusz100_sprawdz',
        legend,
      );
      usage.inputTokens += r.usage.inputTokens;
      usage.outputTokens += r.usage.outputTokens;
      const near = r.objects
        .filter((o) => o.kind === spot.kind)
        .map((o) => ({ o, d: Math.hypot(o.x - side / 2, o.y - side / 2) }))
        .filter(({ d }) => d <= side * NEAR_CENTRE)
        .sort((a, b) => a.d - b.d)[0];
      if (!near) return null;
      // the close-up's position of the symbol is the better one
      return { ...spot, x: x0 + near.o.x / ZOOM, y: y0 + near.o.y / ZOOM };
    } catch (e) {
      if (e instanceof Error && /limit|budżet/i.test(e.message)) stopped = e;
      return null;
    }
  };

  const queue = [...spots];
  const worker = async () => {
    for (let s; !stopped && (s = queue.shift());) confirmed.push(await check(s));
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  bitmap.close();
  if (stopped) throw stopped;
  return { confirmed: confirmed.filter((c): c is MapObject<ReadKind> => c !== null), usage };
}
