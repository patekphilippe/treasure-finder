/** Random URL-safe token (access keys, ids). */
export function randomToken(bytes = 24): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of a given secret with a configured one of at least 24 characters. */
export async function sameSecret(
  given: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || secret.length < 24 || !given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all(
    [given, secret].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))),
  );
  return crypto.subtle.timingSafeEqual(a!, b!);
}
