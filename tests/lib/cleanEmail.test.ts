import { describe, expect, it } from 'vitest';
import { cleanEmail } from '@/shared/lib/cleanEmail';

describe('cleanEmail', () => {
  it('keeps addresses in lower case and refuses anything else', () => {
    expect(cleanEmail('  Jan.Kowalski+mapa@Gmail.com ')).toBe('jan.kowalski+mapa@gmail.com');
    expect(cleanEmail('jan@localhost')).toBeNull();
    expect(cleanEmail('jan kowalski@gmail.com')).toBeNull();
    expect(cleanEmail(undefined)).toBeNull();
    expect(cleanEmail(`${'a'.repeat(250)}@x.pl`)).toBeNull();
  });
});
