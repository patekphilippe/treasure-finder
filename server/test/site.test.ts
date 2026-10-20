import { describe, expect, it } from 'vitest';
import site from '../src/site/index';

const answer = (name: string) => ({
  fetch: async (req: Request) => new Response(`${name} ${new URL(req.url).pathname}`),
});
const env = { ASSETS: answer('app'), API: answer('api') };
// the handler with the test's plain requests and fake bindings
const fetchSite = site.fetch as unknown as (req: Request, e: typeof env) => Promise<Response>;
const get = (url: string, init?: RequestInit) => fetchSite(new Request(url, init), env);

describe('the app on treasurefinder.pl', () => {
  it('serves the app and passes /api/* to the backend with the request as is', async () => {
    expect(await (await get('https://treasurefinder.pl/')).text()).toBe('app /');
    expect(await (await get('https://treasurefinder.pl/assets/index.js')).text()).toBe(
      'app /assets/index.js',
    );
    expect(await (await get('https://treasurefinder.pl/api/health')).text()).toBe(
      'api /api/health',
    );
    expect(await (await get('https://treasurefinder.pl/api-docs')).text()).toBe('app /api-docs');
    // the app shell the service worker caches: served as is, never as a redirect
    expect(await (await get('https://treasurefinder.pl/index.html')).text()).toBe('app /');
  });

  it('sends www and the alias domains to treasurefinder.pl for good', async () => {
    for (const from of [
      'https://www.treasurefinder.pl/?x=1',
      'https://trefinder.pl/?x=1',
      'https://www.trefinder.pl/?x=1',
      'https://tresurefinder.pl/?x=1',
      'http://www.tresurefinder.pl/?x=1',
    ]) {
      const res = await get(from);
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://treasurefinder.pl/?x=1');
    }
    const deep = await get('https://trefinder.pl/api/health');
    expect(deep.headers.get('location')).toBe('https://treasurefinder.pl/api/health');
  });

  it('retires the app a browser installed on an alias domain', async () => {
    const res = await get('https://trefinder.pl/sw.js');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/javascript/);
    expect(await res.text()).toContain('registration.unregister()');
    // the main address keeps its real service worker
    expect(await (await get('https://treasurefinder.pl/sw.js')).text()).toBe('app /sw.js');
  });
});
