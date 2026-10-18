import { createLimiter, type Limiter } from '@/shared/lib/async/createLimiter';

const limiters = new Map<string, Limiter>();

/** One shared queue per host and limit, so all layers of one slow server wait in the same line. */
export function hostLimiter(url: string, max: number): Limiter {
  const key = `${new URL(url, location.href).host}|${max}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = createLimiter(max);
    limiters.set(key, limiter);
  }
  return limiter;
}
