import { spentThisMonth } from './budget';
import type { Env } from './env';
import { corsHeaders, fail, json } from './http';
import { createSubmission, deleteSubmission, getSubmission } from './submissions/routes';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const { pathname } = new URL(request.url);

    if (request.method === 'GET' && pathname === '/api/health') {
      const budget = Number(env.MONTHLY_BUDGET_USD);
      const spent = await spentThisMonth(env.DB, Date.now());
      return json({ ok: true, aiAvailable: spent < budget }, 200, cors);
    }
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

  async scheduled(): Promise<void> {
    // AI pipeline (docs/BACKEND.md): submit new submissions as a batch, collect finished ones.
  },
} satisfies ExportedHandler<Env>;
