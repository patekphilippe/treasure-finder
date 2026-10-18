/** Bytes as megabytes for people: "0,4 MB", "38 MB". */
export function formatMegabytes(bytes: number): string {
  const mb = bytes / 1_000_000;
  return `${mb.toLocaleString('pl-PL', { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}
