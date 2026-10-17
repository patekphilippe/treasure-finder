/** 12 345 m² → "1,23" (hectares, Polish comma) */
export function formatHectares(m2: number): string {
  return (m2 / 10_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 });
}
