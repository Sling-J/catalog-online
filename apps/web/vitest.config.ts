import { defineConfig } from 'vitest/config';

// Отдельно от vite.config.ts: плагин Start в тестах не нужен.
export default defineConfig({
  resolve: { tsconfigPaths: true },
});
