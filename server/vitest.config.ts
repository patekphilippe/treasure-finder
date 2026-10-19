import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations');
  return {
    resolve: { alias: { '@': new URL('../src', import.meta.url).pathname } },
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ANTHROPIC_API_KEY: 'test-key',
            // Cloudflare's documented always-passing Turnstile test secret
            TURNSTILE_SECRET: '1x0000000000000000000000000000000AA',
          },
        },
      }),
    ],
    test: { setupFiles: ['./test/applyMigrations.ts'] },
  };
});
