import { inviteLink } from './inviteLink';

/** Subject and text of the invitation the owner sends from their own mail. */
export function inviteMail(name: string, email: string): { subject: string; body: string } {
  return {
    subject: 'Zaproszenie do Mapy poszukiwań',
    body: [
      `Cześć ${name}!`,
      '',
      'Zapraszam Cię do społeczności w aplikacji Mapa poszukiwań: wspólnej bazy dawnych wsi, ' +
        'młynów, karczm i brodów z map archiwalnych.',
      '',
      `Otwórz link i zaloguj się kontem Google z adresem ${email}:`,
      inviteLink(email),
      '',
      'Zaproszenie działa tylko dla tego adresu.',
    ].join('\n'),
  };
}
