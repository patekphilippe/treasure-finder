const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Cloudflare Turnstile check of the token the app got from the widget. */
export async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
