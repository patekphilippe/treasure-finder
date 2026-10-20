/**
 * Auth0 Post-Login Action (docs/BACKEND.md, "Logowanie"): paste it in Auth0 → Actions → Library →
 * Create Action → Login / Post Login, then put it in the post-login trigger.
 * Secrets of the Action: API_URL (the worker, e.g. https://treasure-finder-api.….workers.dev) and
 * ACTION_SECRET (the same value as the worker's AUTH0_ACTION_SECRET).
 *
 * Lets in only invited addresses and the owner (the worker decides: POST /api/auth/check), so
 * nobody else can even register; then puts the address and first name into the access token.
 */
exports.onExecutePostLogin = async (event, api) => {
  const email = (event.user.email || '').toLowerCase();
  if (!email || !event.user.email_verified)
    return api.access.deny('To konto nie ma potwierdzonego adresu e-mail.');
  let allowed = false;
  try {
    const res = await fetch(`${event.secrets.API_URL}/api/auth/check`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${event.secrets.ACTION_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    allowed = res.ok && (await res.json()).allowed === true;
  } catch {
    return api.access.deny('Serwer aplikacji nie odpowiada, spróbuj za chwilę.');
  }
  if (!allowed)
    return api.access.deny(
      `Adres ${email} nie ma zaproszenia. Zaloguj się kontem, na które przyszło zaproszenie.`,
    );
  // same namespace as CLAIMS in server/src/auth/session.ts
  const ns = 'https://treasure-finder/';
  api.accessToken.setCustomClaim(`${ns}email`, email);
  api.accessToken.setCustomClaim(`${ns}name`, event.user.given_name || event.user.name || '');
};
