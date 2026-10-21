import { memberAuth } from '@/shared/auth/memberAuth';
import { BACKEND_URL } from '@/shared/config/backend';
import type { CommunityObject, Member, NewCommunityObject } from '@/shared/types/community';
import type { Bounds } from '@/shared/store/useMapViewStore';

async function call<T>(path: string, init: RequestInit = {}, auth?: Record<string, string>) {
  const headers = auth ?? (await memberAuth());
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/community/${path}`, {
      ...init,
      headers: { ...headers, ...(init.body ? { 'content-type': 'application/json' } : {}) },
    });
  } catch {
    throw new Error('Brak połączenia z serwerem społeczności');
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(body?.error ?? `Błąd serwera (${res.status})`);
  return body as T;
}

/** The members-only shared base; every call carries the signed-in member's Auth0 token. */
export const communityApi = {
  /** right after signing in, before the membership is remembered */
  me: (token: string) => call<Member>('me', {}, { authorization: `Bearer ${token}` }),
  objects: (b: Bounds) =>
    call<CommunityObject[]>(
      `objects?bbox=${[b.south, b.west, b.north, b.east].map((v) => v.toFixed(5)).join(',')}`,
    ),
  add: (o: NewCommunityObject) =>
    call<{ id: string }>('objects', { method: 'POST', body: JSON.stringify(o) }),
  remove: (id: string) => call<void>(`objects/${id}`, { method: 'DELETE' }),
  /** the member's own objects follow their map placed better after reading */
  move: (moves: { id: string; lat: number; lng: number }[]) =>
    call<{ moved: number }>('objects/moves', { method: 'POST', body: JSON.stringify({ moves }) }),
  vote: (id: string, vote: -1 | 0 | 1, note = '') =>
    call<void>(`objects/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote, note }) }),
};
