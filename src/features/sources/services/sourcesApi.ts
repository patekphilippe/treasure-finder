import type { SubmissionCreated, SubmissionView } from '@/shared/types/sources';
import { memberAuth } from '@/shared/auth/memberAuth';
import { SOURCES_API_URL } from '../config/sourcesApi';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SOURCES_API_URL}${path}`, init);
  } catch {
    throw new Error('Brak połączenia z serwerem analizy');
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(body?.error ?? `Błąd serwera (${res.status})`);
  return body as T;
}

export const sourcesApi = {
  // a signed-in community member needs no Turnstile check
  send: async (form: FormData) =>
    call<SubmissionCreated>('/api/submissions', {
      method: 'POST',
      body: form,
      headers: await memberAuth(),
    }),
  get: (id: string, key: string) =>
    call<SubmissionView>(`/api/submissions/${id}?key=${encodeURIComponent(key)}`),
  remove: (id: string, key: string) =>
    call<void>(`/api/submissions/${id}?key=${encodeURIComponent(key)}`, { method: 'DELETE' }),
};
