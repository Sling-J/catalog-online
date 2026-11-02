import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Фото демо-магазина для моков, как в apps/web: в разработке отдаём design-assets/storefront по /demo/<имя>.jpg.
const demoPhotos = (): Plugin => ({
  name: 'demo-photos',
  apply: 'serve',
  configureServer(server) {
    const dir = resolve(import.meta.dirname, '../../design-assets/storefront');
    server.middlewares.use('/demo', (req, res, next) => {
      const file = resolve(dir, `.${decodeURIComponent(req.url ?? '').split('?')[0]}`);
      if (!file.startsWith(dir) || !file.endsWith('.jpg') || !existsSync(file)) return next();
      res.setHeader('Content-Type', 'image/jpeg');
      res.end(readFileSync(file));
    });
  },
});

// Админка — SPA без SSR (ADR 0001). В разработке открывается на app.localhost:3002, как app.<домен> в продакшене.
export default defineConfig({
  server: { port: 3002, strictPort: true },
  preview: { port: 3002 },
  resolve: { tsconfigPaths: true },
  plugins: [
    // плагин роутера — до плагина React
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    lingui({ macroTransform: true }),
    tailwindcss(),
    demoPhotos(),
  ],
});
