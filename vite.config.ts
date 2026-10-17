import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the app from /<repo-name>/
const REPO_NAME = 'treasure-finder';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react()],
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
