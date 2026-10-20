// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { invitationFromHash } from '@/features/history/utils/invitationFromHash';
import { gmailLink } from '@/features/sources/utils/gmailLink';
import { inviteLink } from '@/features/sources/utils/inviteLink';
import { inviteMail } from '@/features/sources/utils/inviteMail';
import { mailtoLink } from '@/features/sources/utils/mailtoLink';
import { isAuthCallback } from '@/shared/auth/isAuthCallback';

describe('invitations', () => {
  it('the link opens the app and names the invited address', () => {
    const link = inviteLink('anna+mapa@gmail.com');
    expect(link).toBe(
      `${window.location.origin}${window.location.pathname}#zaproszenie=anna%2Bmapa%40gmail.com`,
    );
    expect(invitationFromHash(new URL(link).hash)).toBe('anna+mapa@gmail.com');
  });

  it('the mail says which account to sign in with and carries the link', () => {
    const { subject, body } = inviteMail('Anna', 'anna@gmail.com');
    expect(subject).toMatch(/Zaproszenie/);
    expect(body).toContain('Cześć Anna!');
    expect(body).toContain('kontem Google z adresem anna@gmail.com');
    expect(body).toContain(inviteLink('anna@gmail.com'));
    expect(body).not.toMatch(/[—–]/);
  });

  it('builds ready messages for the mail app and Gmail', () => {
    const mailto = new URL(mailtoLink('anna@gmail.com', 'Temat & co', 'linia 1\nlinia 2'));
    expect(mailto.protocol).toBe('mailto:');
    expect(mailto.pathname).toBe('anna@gmail.com');
    expect(mailto.searchParams.get('subject')).toBe('Temat & co');
    expect(mailto.searchParams.get('body')).toBe('linia 1\nlinia 2');
    const gmail = new URL(gmailLink('anna@gmail.com', 'Temat', 'Treść'));
    expect(gmail.host).toBe('mail.google.com');
    expect(gmail.searchParams.get('to')).toBe('anna@gmail.com');
    expect(gmail.searchParams.get('su')).toBe('Temat');
    expect(gmail.searchParams.get('body')).toBe('Treść');
  });

  it('recognises the return from Auth0, also with an error', () => {
    expect(isAuthCallback('?code=abc&state=xyz')).toBe(true);
    expect(isAuthCallback('?error=access_denied&error_description=Brak&state=xyz')).toBe(true);
    expect(isAuthCallback('?code=abc')).toBe(false);
    expect(isAuthCallback('')).toBe(false);
  });
});
