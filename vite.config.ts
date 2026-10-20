import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // trefinder.pl serves the app from /; the old GitHub Pages address is built with
  // APP_BASE=/treasure-finder/ (.github/workflows/deploy.yml)
  base: process.env.APP_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      // the user decides when to reload: never interrupt a track being recorded
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['logo.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mapa poszukiwań',
        short_name: 'Mapa',
        description: 'Analiza NMT i praca w terenie: mapa, GPS, punkty i trasy.',
        lang: 'pl',
        display: 'standalone',
        theme_color: '#059669',
        background_color: '#f4f4f5',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // the whole app on first open, so it starts without signal
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // browsers use woff2; the old font formats only weigh the cache down
        globIgnores: ['**/la-*.svg', '**/*.eot', '**/*.ttf', '**/*.woff'],
        navigateFallback: 'index.html',
        // on trefinder.pl the backend shares the origin: its answers are never the app
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // map tiles: a downloaded area (Cache Storage, features/offline) first, then the network.
        // Nothing is stored here, so browsing never fills the phone. Our relief tiles come from
        // the same origin on trefinder.pl (/api/relief/), from the workers.dev backend elsewhere.
        runtimeCaching: [
          {
            urlPattern: ({ request, url, sameOrigin }) =>
              (sameOrigin && url.pathname.startsWith('/api/relief/')) ||
              (!sameOrigin &&
                (request.destination === 'image' || url.hostname.endsWith('geoportal.gov.pl'))),
            handler: async ({ request }) => (await caches.match(request.url)) ?? fetch(request),
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  build: {
    rolldownOptions: {
      output: {
        // libraries change rarely — separate chunks stay cached between deploys
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            {
              name: 'mui',
              test: /node_modules[\\/](@mui|@emotion|@popperjs|react-transition-group)[\\/]/,
            },
            {
              name: 'leaflet',
              test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/,
            },
            { name: 'files', test: /node_modules[\\/](jszip|pako|proj4|geotiff)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
