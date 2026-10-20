/**
 * The app's own address (server/site.wrangler.toml, docs/BACKEND.md "Adres aplikacji"). The old
 * GitHub Pages address keeps working for a while: data stays per address and moves by a backup.
 */
export const APP_HOST = 'treasurefinder.pl';
export const APP_URL = `https://${APP_HOST}/`;

/** the old address, …github.io/treasure-finder/ */
export const isOldAddress = (hostname: string) => hostname.endsWith('.github.io');
