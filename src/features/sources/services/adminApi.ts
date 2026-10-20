import type { AdminCommunityObject, AdminMember } from '@/shared/types/community';
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

const TOKEN_KEY = 'mapa.adminToken';

export const adminToken = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
      return '';
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      // private window: the token lasts until reload
    }
  },
};

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SOURCES_API_URL}/api/admin/${path}`, {
    ...init,
    headers: { authorization: `Bearer ${adminToken.get()}`, ...(init.headers ?? {}) },
  });
  if (res.status === 401) throw new Error('Nieprawidłowy token panelu');
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
  /** the code comes back only here, once */
  invite: async (name: string) =>
    (await (
      await call('members', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: { 'content-type': 'application/json' },
      })
    ).json()) as { id: string; name: string; code: string },
  block: (id: string, blocked: boolean) =>
    call(`members/${id}/${blocked ? 'block' : 'unblock'}`, { method: 'POST' }),
  objects: async (filter: 'recent' | 'disputed' | 'removed') =>
    (await (await call(`objects?filter=${filter}`)).json()) as AdminCommunityObject[],
  moderate: (id: string, remove: boolean) =>
    call(`objects/${id}/${remove ? 'remove' : 'restore'}`, { method: 'POST' }),
};
