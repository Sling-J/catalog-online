import { lingui } from '@lingui/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Запросы к API в разработке — через этот же сервер, как в админке (T-501): `/v1` пересылается на API, cookie
 * сотрудника `staff_sid` — первая сторона. Адрес API — API_PROXY_TARGET, по умолчанию http://localhost:3001.
 */
const apiProxy = { '/v1': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001', changeOrigin: false } };

// Суперадминка — отдельное SPA (ADR 0005). В разработке — staff.localhost:3003, как staff.<домен> в продакшене.
export default defineConfig({
  server: { port: 3003, strictPort: true, proxy: apiProxy },
  preview: { port: 3003, proxy: apiProxy },
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
    // строки суперадминки без переводов; плагин раскрывает макросы в компонентах @catalog/ui
    lingui({ macroTransform: true }),
    tailwindcss(),
  ],
});
