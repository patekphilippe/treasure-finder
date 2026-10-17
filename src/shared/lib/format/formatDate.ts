const FORMAT = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "17 paź 2026, 14:05" */
export function formatDate(timestamp: number): string {
  return FORMAT.format(timestamp);
}
