import { lingui } from '@lingui/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
  ],
});
