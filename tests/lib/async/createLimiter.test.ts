import { describe, expect, it } from 'vitest';
import { createLimiter } from '@/shared/lib/async/createLimiter';

const tick = () => new Promise((r) => setTimeout(r, 1));

describe('createLimiter', () => {
  it('never runs more than the limit at once and finishes every task in order', async () => {
    const limit = createLimiter(2);
    let running = 0;
    let peak = 0;
    const started: number[] = [];
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        limit(async () => {
          started.push(n);
          running++;
          peak = Math.max(peak, running);
          await tick();
          running--;
          return n * 10;
        }),
      ),
    );
    expect(peak).toBe(2);
    expect(started).toEqual([1, 2, 3, 4, 5]);
    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it('frees the slot when a task fails', async () => {
    const limit = createLimiter(1);
    await expect(limit(() => Promise.reject(new Error('x')))).rejects.toThrow('x');
    await expect(limit(async () => 'ok')).resolves.toBe('ok');
  });
});
