/** Calendar month key for the spending counter, UTC. */
export function monthKey(now: number): string {
  return new Date(now).toISOString().slice(0, 7);
}

export async function spentThisMonth(db: D1Database, now: number): Promise<number> {
  const row = await db
    .prepare('SELECT spent_usd FROM budget WHERE month = ?')
    .bind(monthKey(now))
    .first<{ spent_usd: number }>();
  return row?.spent_usd ?? 0;
}

export async function addSpending(db: D1Database, now: number, usd: number): Promise<void> {
  await db
    .prepare(
      'INSERT INTO budget (month, spent_usd) VALUES (?1, ?2) ' +
        'ON CONFLICT (month) DO UPDATE SET spent_usd = spent_usd + ?2',
    )
    .bind(monthKey(now), usd)
    .run();
}
