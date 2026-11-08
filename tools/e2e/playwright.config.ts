import { defineConfig } from '@playwright/test';

// Сценарии в браузере (ADR 0001; T-502). Пока бэкенда нет — админка на моках MSW: свой дев-сервер на 3022, чтобы не
// мешать открытому в работе на 3002. Браузер — установленный Google Chrome (канал chrome), как в design-compare:
// браузеры Playwright не скачиваем.
const PORT = 3022;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm --filter @catalog/admin exec vite --port ${PORT} --strictPort`,
    cwd: '../..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
