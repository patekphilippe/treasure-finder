/** Invitation link `…/#dolacz=<kod>` → the code, or null. */
export function joinCodeFromHash(hash: string): string | null {
  const m = /^#dolacz=([A-Za-z0-9_-]{16,128})$/.exec(hash);
  return m ? m[1]! : null;
}
