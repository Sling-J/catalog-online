import { lingui } from '@lingui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Макросы Lingui (Trans, t) раскрывает сам Vite-плагин — Babel не нужен.
export default defineConfig({
  plugins: [react(), lingui({ macroTransform: true })],
  test: {
    environment: 'jsdom',
  },
});
