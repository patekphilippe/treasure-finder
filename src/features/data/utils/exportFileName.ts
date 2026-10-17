/** poszukiwania-2026-10-17.zip (local date) */
export function exportFileName(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `poszukiwania-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.zip`;
}
