import { sha256Hex } from './crypto';

/** IP hashed together with the day: enough to count requests, useless for tracking a person. */
export async function ipSubject(
  request: Request,
  now: number,
): Promise<{ ip: string; subject: string }> {
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const day = new Date(now).toISOString().slice(0, 10);
  return { ip, subject: `ip:${(await sha256Hex(`${day}|${ip}`)).slice(0, 32)}` };
}
