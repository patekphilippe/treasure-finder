import { memberAuth } from '@/shared/auth/memberAuth';
import { BACKEND_URL } from '@/shared/config/backend';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { MapPlacement } from '@/shared/types/placement';
import { AI_MAX_SIDE } from '../config/aiReading';

/**
 * Asks the backend where a scanned map lies (POST /api/placements): Claude reads its sheet number,
 * frame and place names, the backend finds the names on today's map and fits the scan. Sends a
 * reduced copy of the image and the current view as a hint; nothing else leaves the device.
 */
export async function placeOwnMap(file: Blob, view: Bounds | null): Promise<MapPlacement> {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, AI_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(16, Math.round(bitmap.width * k));
  const h = Math.max(16, Math.round(bitmap.height * k));
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const image = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });

  const form = new FormData();
  form.append('image', image, 'mapa.jpg');
  form.append('w', String(w));
  form.append('h', String(h));
  if (view) form.append('view', [view.south, view.west, view.north, view.east].join(','));
  const headers = await memberAuth();
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/placements`, {
      method: 'POST',
      body: form,
      headers,
    });
  } catch {
    throw new Error('Brak połączenia z serwerem analizy');
  }
  const body = (await response.json().catch(() => null)) as
    (MapPlacement & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? `Błąd serwera (${response.status})`);
  return body;
}
