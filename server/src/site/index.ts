/** Bindings of the app's own worker (site.wrangler.toml). */
interface SiteEnv {
  /** the built PWA (../dist) */
  ASSETS: Fetcher;
  /** the API worker (treasure-finder-api) */
  API: Fetcher;
}

/** the main address; www and the alias domains redirect to it (a worker exports only handlers) */
const MAIN_HOST = 'treasurefinder.pl';
const LOCAL = new Set(['localhost', '127.0.0.1']);

/**
 * The service worker of the alias domains. trefinder.pl served the app for a few hours, and a
 * browser that installed it there would keep opening its copy; this one drops the copy, so the
 * next visit reaches the redirect. Open pages are not reloaded: a recording track keeps going.
 */
const RETIRE_SW = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.registration.unregister()));
`;

/**
 * The app on its own address (docs/BACKEND.md, "Adres aplikacji"): `/api/…` goes to the API worker,
 * so the backend has the same origin and needs no CORS; everything else is the built PWA. Other
 * hostnames (www, trefinder.pl, tresurefinder.pl) redirect for good, path and query kept.
 */
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname !== MAIN_HOST && !LOCAL.has(url.hostname)) {
      if (url.pathname === '/sw.js')
        return new Response(RETIRE_SW, {
          headers: {
            'content-type': 'text/javascript; charset=utf-8',
            'cache-control': 'no-cache',
          },
        });
      url.protocol = 'https:';
      url.hostname = MAIN_HOST;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith('/api/')) return env.API.fetch(request);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<SiteEnv>;
