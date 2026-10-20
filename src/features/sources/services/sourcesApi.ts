import type { SubmissionCreated, SubmissionView } from '@/shared/types/sources';
import { useMembership } from '@/shared/store/useMembership';
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
  send: (form: FormData) => {
    // a community member's invitation code stands in for the Turnstile check
    const code = useMembership.getState().code;
    return call<SubmissionCreated>('/api/submissions', {
      method: 'POST',
      body: form,
      ...(code ? { headers: { authorization: `Bearer ${code}` } } : {}),
    });
  },
  get: (id: string, key: string) =>
    call<SubmissionView>(`/api/submissions/${id}?key=${encodeURIComponent(key)}`),
  remove: (id: string, key: string) =>
    call<void>(`/api/submissions/${id}?key=${encodeURIComponent(key)}`, { method: 'DELETE' }),
};
