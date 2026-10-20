/** The link an invited person opens: the app's address with `#zaproszenie=<adres>`, which starts signing in. */
export const inviteLink = (email: string) =>
  `${window.location.origin}${window.location.pathname}#zaproszenie=${encodeURIComponent(email)}`;
