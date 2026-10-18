/** Stable id from content (two FNV-1a hashes), so importing the same file twice adds nothing. */
export function contentId(prefix: string, content: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < content.length; i++) {
    const c = content.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x811c9dc5) + i;
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${prefix}-${hex(a)}${hex(b)}`;
}
