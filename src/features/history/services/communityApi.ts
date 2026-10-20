import { BACKEND_URL } from '@/shared/config/backend';
import type { CommunityObject, Member, NewCommunityObject } from '@/shared/types/community';
import type { Bounds } from '@/shared/store/useMapViewStore';

async function call<T>(code: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/community/${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${code}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new Error('Brak połączenia z serwerem społeczności');
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(body?.error ?? `Błąd serwera (${res.status})`);
  return body as T;
}

/** The members-only shared base; every call carries the member's invitation code. */
export const communityApi = {
  me: (code: string) => call<Member>(code, 'me'),
  objects: (code: string, b: Bounds) =>
    call<CommunityObject[]>(
      code,
      `objects?bbox=${[b.south, b.west, b.north, b.east].map((v) => v.toFixed(5)).join(',')}`,
    ),
  add: (code: string, o: NewCommunityObject) =>
    call<{ id: string }>(code, 'objects', { method: 'POST', body: JSON.stringify(o) }),
  remove: (code: string, id: string) => call<void>(code, `objects/${id}`, { method: 'DELETE' }),
  vote: (code: string, id: string, vote: -1 | 0 | 1, note = '') =>
    call<void>(code, `objects/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote, note }),
    }),
};
