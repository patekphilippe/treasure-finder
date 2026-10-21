/** CORS headers for the PWA's origin; other origins get none and the browser blocks them. */
export function corsHeaders(request: Request, allowedOrigins: string): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowed = allowedOrigins.split(',').map((o) => o.trim());
  if (!allowed.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/** Error answer with a Polish message the app can show as is. */
export function fail(status: number, message: string, headers: Record<string, string> = {}) {
  return json({ error: message }, status, headers);
}

/** The token from `Authorization: Bearer <token>`; null when absent. */
export function bearer(request: Request): string | null {
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  return given || null;
}
