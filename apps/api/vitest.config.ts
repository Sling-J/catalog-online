import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// esbuild в Vitest не выдаёт метаданные декораторов, без них DI в Nest не работает — собираем тесты SWC
// (backend-structure.md, раздел 11; pitfalls.md).
const plugins = [swc.vite({ module: { type: 'es6' } })];

export default defineConfig({
  test: {
    projects: [
      {
        plugins,
        test: { name: 'unit', include: ['src/**/*.test.ts'], exclude: ['src/**/*.e2e.test.ts'] },
      },
      {
        plugins,
        test: {
          name: 'e2e',
          include: ['src/**/*.e2e.test.ts'],
          // Один контейнер PostgreSQL на прогон, у каждого файла тестов своя база из шаблона
          globalSetup: ['test/global-setup.ts'],
          setupFiles: ['test/setup-e2e.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
