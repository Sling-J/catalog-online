import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Фото демо-магазина для моков: в разработке отдаём design-assets/storefront по /demo/<имя>.jpg.
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

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart({
      router: {
        entry: './app/router.tsx',
        routesDirectory: './app/routes',
        generatedRouteTree: './app/routeTree.gen.ts',
      },
      client: { entry: './app/client.tsx' },
      server: { entry: './app/server.ts' },
    }),
    // плагин React — после плагина Start
    react(),
    tailwindcss(),
    demoPhotos(),
  ],
});
