/** "850 m", "1,24 km", "12,5 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const digits = km < 10 ? 2 : 1;
  return `${km.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits })} km`;
}
