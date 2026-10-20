import { describe, expect, it } from 'vitest';
import site from '../src/site/index';

const answer = (name: string) => ({
  fetch: async (req: Request) => new Response(`${name} ${new URL(req.url).pathname}`),
});
const env = { ASSETS: answer('app'), API: answer('api') };
// the handler with the test's plain requests and fake bindings
const fetchSite = site.fetch as unknown as (req: Request, e: typeof env) => Promise<Response>;
const get = (url: string, init?: RequestInit) => fetchSite(new Request(url, init), env);

describe('the app on trefinder.pl', () => {
  it('serves the app and passes /api/* to the backend with the request as is', async () => {
    expect(await (await get('https://trefinder.pl/')).text()).toBe('app /');
    expect(await (await get('https://trefinder.pl/assets/index.js')).text()).toBe(
      'app /assets/index.js',
    );
    expect(await (await get('https://trefinder.pl/api/health')).text()).toBe('api /api/health');
    expect(await (await get('https://trefinder.pl/api-docs')).text()).toBe('app /api-docs');
  });

  it('sends www and the alias domain to trefinder.pl for good', async () => {
    for (const from of [
      'https://www.trefinder.pl/?x=1',
      'https://tresurefinder.pl/?x=1',
      'http://www.tresurefinder.pl/?x=1',
    ]) {
      const res = await get(from);
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://trefinder.pl/?x=1');
    }
    const deep = await get('https://tresurefinder.pl/api/health');
    expect(deep.headers.get('location')).toBe('https://trefinder.pl/api/health');
  });
});
