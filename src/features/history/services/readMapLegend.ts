import type { OwnMap } from '@/shared/types/domain';
import { AI_MAX_SIDE, type AiModelId } from '../config/aiReading';
import { readMapWithAi } from './readMapWithAi';

/**
 * Where a sheet prints its legend: the right margin (WIG, "Objaśnienie znaków") and the bottom
 * one (Karte des Deutschen Reiches, "Zeichenerklärung"), as shares of the scan.
 */
const MARGINS = [
  { x: 0.75, y: 0, w: 0.25, h: 1 },
  { x: 0, y: 0.82, w: 0.75, h: 0.18 },
];
/** what the reading is told at most: the lines a legend has on places and buildings */
const MAX_LEGEND = 3500;
/** pieces read at once */
const PARALLEL = 2;

/**
 * The sheet's own legend, read once from the margins of the scan before the map: the reading
 * then knows this edition's signs and abbreviations (an inn may be "Kr.", "Whs." or "Karczma").
 * Lines "sign: meaning", or null when no legend was found. A daily limit or an exhausted budget
 * stops it; other failures just leave that piece out.
 */
export async function readMapLegend(map: OwnMap, model: AiModelId): Promise<string | null> {
  const bitmap = await createImageBitmap(map.image);
  const pieces: { x: number; y: number; w: number; h: number }[] = [];
  for (const m of MARGINS) {
    const x0 = Math.round(m.x * bitmap.width);
    const y0 = Math.round(m.y * bitmap.height);
    const w = Math.round(m.w * bitmap.width);
    const h = Math.round(m.h * bitmap.height);
    const cols = Math.ceil(w / AI_MAX_SIDE);
    const rows = Math.ceil(h / AI_MAX_SIDE);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        pieces.push({
          x: x0 + Math.round((c * w) / cols),
          y: y0 + Math.round((r * h) / rows),
          w: Math.round(w / cols),
          h: Math.round(h / rows),
        });
  }

  const lines = new Set<string>();
  let stopped: Error | null = null;
  const queue = [...pieces];
  const worker = async () => {
    for (let p; !stopped && (p = queue.shift());) {
      const canvas = new OffscreenCanvas(p.w, p.h);
      canvas.getContext('2d')!.drawImage(bitmap, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      const image = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
      try {
        const r = await readMapWithAi(image, p.w, p.h, 8, model, 'legenda');
        for (const line of r.legend) lines.add(line);
      } catch (e) {
        if (e instanceof Error && /limit|budżet/i.test(e.message)) stopped = e;
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  bitmap.close();
  if (stopped) throw stopped;
  const legend = [...lines].join('\n').slice(0, MAX_LEGEND);
  return legend || null;
}
