export type AiKeyStatus = 'ok' | 'invalid' | 'missing' | 'unknown';

/** health is public: the key is checked at most once per this period */
const CACHE_MS = 10 * 60 * 1000;
let cached: { key: string; status: AiKeyStatus; at: number } | null = null;

/**
 * Whether the Anthropic key works, from the free model list endpoint (no tokens are used).
 * 'unknown' when Anthropic could not be reached; that answer is not cached.
 */
export async function aiKeyStatus(key: string | undefined, now: number): Promise<AiKeyStatus> {
  if (!key) return 'missing';
  if (cached && cached.key === key && now - cached.at < CACHE_MS) return cached.status;
  let status: AiKeyStatus;
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    });
    status = res.ok ? 'ok' : res.status === 401 || res.status === 403 ? 'invalid' : 'unknown';
  } catch {
    status = 'unknown';
  }
  if (status !== 'unknown') cached = { key, status, at: now };
  return status;
}

/** tests only */
export function resetAiKeyCache(): void {
  cached = null;
}
