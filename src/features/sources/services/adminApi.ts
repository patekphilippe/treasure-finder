import type { AdminCommunityObject, AdminMember } from '@/shared/types/community';
import { memberAuth } from '@/shared/auth/memberAuth';
import type { SourceObject, SubmissionResult, ViewBbox } from '@/shared/types/sources';
import { SOURCES_API_URL } from '../config/sourcesApi';

export interface AdminSubmission {
  id: string;
  mode: 'public' | 'private';
  status: string;
  text: string | null;
  link: string | null;
  view_bbox: ViewBbox | null;
  created_at: number;
  cost_usd: number | null;
  result: SubmissionResult | null;
  files: { id: string; mime: string }[];
}

/** The owner signs in like a member; the backend knows their address (ADMIN_EMAILS). */
async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SOURCES_API_URL}/api/admin/${path}`, {
    ...init,
    headers: { ...(await memberAuth()), ...(init.headers ?? {}) },
  });
  if (res.status === 401) throw new Error('To konto nie ma dostępu do panelu właściciela');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Błąd serwera (${res.status})`);
  }
  return res;
}

export const adminApi = {
  list: async () => (await (await call('submissions')).json()) as AdminSubmission[],
  budget: async () =>
    (await (await call('budget')).json()) as { month: string; spentUsd: number; budgetUsd: number },
  file: async (id: string) => URL.createObjectURL(await (await call(`files/${id}`)).blob()),
  approve: (id: string, objects: SourceObject[], source: string) =>
    call(`submissions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ objects, source }),
      headers: { 'content-type': 'application/json' },
    }),
  reject: (id: string) => call(`submissions/${id}/reject`, { method: 'POST' }),
  members: async () => (await (await call('members')).json()) as AdminMember[],
  /** the invitation is the address: the first sign-in with it takes this member */
  invite: async (name: string, email: string) =>
    (await (
      await call('members', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
        headers: { 'content-type': 'application/json' },
      })
    ).json()) as { id: string; name: string; email: string },
  /** a new address frees the member for the account with that address */
  setEmail: (id: string, email: string) =>
    call(`members/${id}/email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'content-type': 'application/json' },
    }),
  block: (id: string, blocked: boolean) =>
    call(`members/${id}/${blocked ? 'block' : 'unblock'}`, { method: 'POST' }),
  objects: async (filter: 'recent' | 'disputed' | 'removed') =>
    (await (await call(`objects?filter=${filter}`)).json()) as AdminCommunityObject[],
  moderate: (id: string, remove: boolean) =>
    call(`objects/${id}/${remove ? 'remove' : 'restore'}`, { method: 'POST' }),
};
