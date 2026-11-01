import { lingui } from '@lingui/vite-plugin';
import { defineConfig } from 'vitest/config';

// Отдельно от vite.config.ts: плагин Start в тестах не нужен. Макросы Lingui раскрываем, потому что
// тесты импортируют срезы целиком, а в них есть компоненты с `Trans`.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [lingui({ macroTransform: true })],
});
