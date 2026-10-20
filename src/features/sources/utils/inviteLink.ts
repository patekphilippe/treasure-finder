/** The link a new member opens to join: the app's address with `#dolacz=<kod>`. */
export const inviteLink = (code: string) =>
  `${window.location.origin}${window.location.pathname}#dolacz=${code}`;
