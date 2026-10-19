import { spentThisMonth } from './budget';
import type { Env } from './env';
import { corsHeaders, fail, json } from './http';

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
    return fail(404, 'Nie ma takiego adresu', cors);
  },

  async scheduled(): Promise<void> {
    // AI pipeline (docs/BACKEND.md): submit new submissions as a batch, collect finished ones.
  },
} satisfies ExportedHandler<Env>;
