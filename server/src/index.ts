import { spentThisMonth } from './budget';
import type { Env } from './env';
import { adminRoutes } from './admin/routes';
import { aiKeyStatus } from './aiKeyStatus';
import { readView } from './readings/routes';
import { serveContext } from './context/routes';
import { corsHeaders, fail, json } from './http';
import { anthropicClient } from './pipeline/aiClient';
import { deleteExpired } from './pipeline/cleanup';
import { runPipeline } from './pipeline/runPipeline';
import { createSubmission, deleteSubmission, getSubmission } from './submissions/routes';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const { pathname } = new URL(request.url);

    if (request.method === 'GET' && pathname === '/api/health') {
      const budget = Number(env.MONTHLY_BUDGET_USD);
      const spent = await spentThisMonth(env.DB, Date.now());
      const aiKey = await aiKeyStatus(env.ANTHROPIC_API_KEY, Date.now());
      return json(
        {
          ok: true,
          // analysis runs only with a working key and money left this month
          aiAvailable: aiKey === 'ok' && spent < budget,
          aiKey,
          sourcesAvailable: Boolean(env.TURNSTILE_SECRET),
        },
        200,
        cors,
      );
    }
    if (pathname.startsWith('/api/admin/'))
      return adminRoutes(request, env, pathname.slice('/api/admin/'.length), cors, Date.now());
    if (request.method === 'GET' && pathname.startsWith('/api/kontekst/'))
      return serveContext(env, pathname.slice('/api/kontekst/'.length), cors);
    if (request.method === 'POST' && pathname === '/api/readings')
      return readView(request, env, cors, Date.now());
    if (request.method === 'POST' && pathname === '/api/submissions')
      return createSubmission(request, env, cors, Date.now());
    const one = /^\/api\/submissions\/([A-Za-z0-9_-]+)$/.exec(pathname);
    if (one) {
      const key = new URL(request.url).searchParams.get('key');
      if (request.method === 'GET') return getSubmission(env, one[1]!, key, cors);
      if (request.method === 'DELETE') return deleteSubmission(env, one[1]!, key, cors);
    }
    return fail(404, 'Nie ma takiego adresu', cors);
  },

  // AI pipeline (docs/BACKEND.md): collect finished batches, then send new submissions as one batch
  async scheduled(_controller, env, ctx): Promise<void> {
    // until the owner sets the key (docs/BACKEND.md) submissions simply wait; old ones still go
    if (!env.ANTHROPIC_API_KEY) {
      ctx.waitUntil(deleteExpired(env, Date.now()).then(() => undefined));
      return;
    }
    ctx.waitUntil(
      runPipeline(env, anthropicClient(env.ANTHROPIC_API_KEY), Date.now()).then(() => undefined),
    );
  },
} satisfies ExportedHandler<Env>;
