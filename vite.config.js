import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

function markdownSpaFallback() {
  return {
    name: 'markdown-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0];

        // Let API/proxy and Vite internals pass through untouched
        if (!url || url.startsWith('/api') || url.startsWith('/@')) {
          return next();
        }

        // In dev, Vite will serve existing *.md files as plain text. Rewrite those
        // requests so the SPA loads and the app can render via /api/markdown.
        if (url.endsWith('.md')) {
          req.url = '/index.html';
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    markdownSpaFallback()
  ],
  publicDir: 'public',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    emptyOutDir: true
  }
});
