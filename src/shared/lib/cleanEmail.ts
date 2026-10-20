/** An e-mail address in lower case, or null when it does not look like one. */
export function cleanEmail(raw: unknown): string | null {
  const email = String(raw ?? '')
    .trim()
    .toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
