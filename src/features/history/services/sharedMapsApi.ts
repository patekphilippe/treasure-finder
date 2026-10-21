import { memberAuth } from '@/shared/auth/memberAuth';
import { BACKEND_URL } from '@/shared/config/backend';
import type { SharedMap } from '@/shared/types/community';
import type { OwnMap } from '@/shared/types/domain';

const base = () => `${BACKEND_URL}/api/community/maps`;

async function send(url: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: await memberAuth() });
  } catch {
    throw new Error('Brak połączenia z serwerem społeczności');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Błąd serwera (${res.status})`);
  }
  return res;
}

/** Own maps shared with the community (server/src/community/maps.ts). */
export const sharedMapsApi = {
  list: async () => (await (await send(base())).json()) as SharedMap[],
  image: async (id: string) => (await send(`${base()}/${id}/image`)).blob(),
  /** the placement, and the scan the first time */
  put: async (map: OwnMap, withImage: boolean) => {
    const form = new FormData();
    const { name, year, width, height, pixelToSource, epsg, method, readAt } = map;
    form.append(
      'meta',
      JSON.stringify({ name, year, width, height, pixelToSource, epsg, method, readAt }),
    );
    if (withImage) form.append('image', map.image, `${map.id}.${map.image.type.split('/')[1]}`);
    return (await (
      await send(`${base()}/${map.id}`, { method: 'PUT', body: form })
    ).json()) as SharedMap;
  },
  remove: async (id: string) => void (await send(`${base()}/${id}`, { method: 'DELETE' })),
};
