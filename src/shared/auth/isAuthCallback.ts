/** The address Auth0 returns to after signing in: `?code=…&state=…` or `?error=…&state=…`. */
export function isAuthCallback(search: string): boolean {
  const q = new URLSearchParams(search);
  return q.has('state') && (q.has('code') || q.has('error'));
}
