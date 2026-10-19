/**
 * Counts one use for each subject today and says whether all are still within `limit`.
 * The counter goes up only when allowed, so refused requests do not use the quota.
 */
export async function consumeDaily(
  db: D1Database,
  subjects: string[],
  limit: number,
  now: number,
): Promise<boolean> {
  const day = new Date(now).toISOString().slice(0, 10);
  const placeholders = subjects.map(() => '?').join(',');
  const rows = await db
    .prepare(`SELECT count FROM daily_usage WHERE day = ? AND subject IN (${placeholders})`)
    .bind(day, ...subjects)
    .all<{ count: number }>();
  if (rows.results.some((r) => r.count >= limit)) return false;
  await db.batch(
    subjects.map((s) =>
      db
        .prepare(
          'INSERT INTO daily_usage (day, subject, count) VALUES (?, ?, 1) ' +
            'ON CONFLICT (day, subject) DO UPDATE SET count = count + 1',
        )
        .bind(day, s),
    ),
  );
  return true;
}
