import { BACKEND_URL } from '@/shared/config/backend';
import { deviceId } from '@/shared/lib/deviceId';
import { useMembership } from '@/shared/store/useMembership';
import type { MapObject, ReadKind, ReadProfileId } from '@/shared/lib/history';
import type { MapReading } from '@/shared/types/readings';
import type { AiModelId } from '../config/aiReading';

export type AiUsage = MapReading['usage'];

/**
 * Sends one map view to the backend, which asks Claude with the owner's key (server/, POST
 * /api/readings) and returns the buildings and places it read, in image pixels. Only the image
 * of the map leaves the device; the backend does not keep it.
 */
export async function readMapWithAi(
  image: Blob,
  w: number,
  h: number,
  res: number,
  model: AiModelId,
  profile: ReadProfileId,
  turnstileToken: string | null,
): Promise<{ objects: MapObject<ReadKind>[]; usage: AiUsage }> {
  const form = new FormData();
  form.append('image', image, 'widok.jpg');
  form.append('w', String(w));
  form.append('h', String(h));
  form.append('res', String(res));
  form.append('model', model);
  form.append('profile', profile);
  form.append('deviceId', deviceId());
  if (turnstileToken) form.append('turnstile', turnstileToken);
  // a community member's invitation code stands in for the Turnstile check
  const code = useMembership.getState().code;
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/readings`, {
      method: 'POST',
      body: form,
      ...(code ? { headers: { authorization: `Bearer ${code}` } } : {}),
    });
  } catch {
    throw new Error('Brak połączenia z serwerem analizy');
  }
  const body = (await response.json().catch(() => null)) as
    (MapReading & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? `Błąd serwera (${response.status})`);
  return { objects: body.objects, usage: body.usage };
}
