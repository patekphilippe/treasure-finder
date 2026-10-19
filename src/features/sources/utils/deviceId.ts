import { createId } from '@/shared/lib/createId';

const KEY = 'mapa.deviceId';

/** Random id of this browser for the backend's daily limit; not linked to a person. */
export function deviceId(): string {
  try {
    const known = localStorage.getItem(KEY);
    if (known) return known;
    const made = createId().replace(/-/g, '');
    localStorage.setItem(KEY, made);
    return made;
  } catch {
    return createId().replace(/-/g, '');
  }
}
