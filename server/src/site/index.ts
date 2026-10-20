/** Bindings of the app's own worker (site.wrangler.toml). */
interface SiteEnv {
  /** the built PWA (../dist) */
  ASSETS: Fetcher;
  /** the API worker (treasure-finder-api) */
  API: Fetcher;
}

/** the main address; www and the alias domain redirect to it (a worker exports only handlers) */
const MAIN_HOST = 'trefinder.pl';
const LOCAL = new Set(['localhost', '127.0.0.1']);

/**
 * The app on its own address (docs/BACKEND.md, "Adres aplikacji"): `/api/…` goes to the API worker,
 * so the backend has the same origin and needs no CORS; everything else is the built PWA. Other
 * hostnames (www, tresurefinder.pl) redirect for good, path and query kept.
 */
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname !== MAIN_HOST && !LOCAL.has(url.hostname)) {
      url.protocol = 'https:';
      url.hostname = MAIN_HOST;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith('/api/')) return env.API.fetch(request);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<SiteEnv>;
