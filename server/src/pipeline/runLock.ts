/** a run that crashed gives the lock up after this long */
export const LOCK_MS = 10 * 60_000;

/**
 * Takes the pipeline lock unless another run holds it. Returns the lock's expiry to release it
 * with, or null when another run is still going.
 */
export async function takeLock(db: D1Database, now: number): Promise<number | null> {
  const until = now + LOCK_MS;
  const res = await db
    .prepare(
      "INSERT INTO pipeline_lock (name, until) VALUES ('pipeline', ?1) " +
        'ON CONFLICT (name) DO UPDATE SET until = ?1 WHERE pipeline_lock.until <= ?2',
    )
    .bind(until, now)
    .run();
  return res.meta.changes ? until : null;
}

/** Gives the lock up, unless it expired meanwhile and another run took it. */
export async function releaseLock(db: D1Database, until: number): Promise<void> {
  await db
    .prepare("UPDATE pipeline_lock SET until = 0 WHERE name = 'pipeline' AND until = ?")
    .bind(until)
    .run();
}
