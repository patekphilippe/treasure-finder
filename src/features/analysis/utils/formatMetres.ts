/** 1.25 → "1,3" (one decimal, Polish comma, no trailing ",0"). */
export function formatMetres(value: number): string {
  return value.toLocaleString('pl-PL', { maximumFractionDigits: 1 });
}
