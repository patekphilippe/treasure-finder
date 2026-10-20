import { generateKeyPairSync } from 'node:crypto';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// sign-in in tests: the worker trusts this key (AUTH0_JWKS), test/signIn.ts signs with its pair
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations');
  return {
    resolve: { alias: { '@': new URL('../src', import.meta.url).pathname } },
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // in production the bucket is bound in wrangler.toml (docs/BACKEND.md)
          r2Buckets: ['TILES'],
          bindings: {
            TEST_MIGRATIONS: migrations,
            ANTHROPIC_API_KEY: 'test-key',
            ADMIN_TOKEN: 'test-admin-token-0123456789abcdef',
            AUTH0_DOMAIN: 'login.test',
            AUTH0_JWKS: JSON.stringify({
              keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test', alg: 'RS256' }],
            }),
            TEST_SIGNING_KEY: JSON.stringify(privateKey.export({ format: 'jwk' })),
            ADMIN_EMAILS: 'owner@example.com',
            AUTH0_ACTION_SECRET: 'test-action-secret-0123456789abcdef',
          },
        },
      }),
    ],
    test: { setupFiles: ['./test/applyMigrations.ts'] },
  };
});
