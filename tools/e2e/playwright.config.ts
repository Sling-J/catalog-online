import { defineConfig } from '@playwright/test';

import { apiEnv, PORTS } from './e2e-env.ts';

// Сценарии в браузере на настоящем API (ADR 0001; T-502, решения основателя 2026-11-14): своя база `catalog_e2e`,
// API, админка, витрина и суперадминка на портах 3101 / 3102 / 3100 / 3103 — не мешают разработке на 3000–3002; фронты — продакшен-сборки
// (`scripts/start-fronts.ts`). Каждый прогон начинается
// с чистой базы (`scripts/start-api.ts`), поэтому уже запущенные серверы не переиспользуем. Нужен docker compose
// (PostgreSQL и S3). Браузер — установленный Google Chrome (канал chrome), браузеры Playwright не скачиваем.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    channel: 'chrome',
    trace: 'retain-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Asia/Almaty',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      name: 'api',
      command: 'node scripts/start-api.ts',
      url: `http://localhost:${PORTS.api}/health`,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
    },
    {
      // собирает и запускает админку, витрину и суперадминку; ждём админку, остальные — следующие записи
      name: 'fronts',
      command: 'node scripts/start-fronts.ts',
      url: `http://localhost:${PORTS.admin}`,
      reuseExistingServer: false,
      timeout: 300_000,
    },
    {
      // витрину уже поднял `start-fronts.ts` (записи запускаются по очереди) — здесь только ждём её адрес
      name: 'web',
      command: 'node scripts/wait-forever.ts',
      url: `http://localhost:${PORTS.web}`,
      reuseExistingServer: true,
      timeout: 300_000,
    },
    {
      // суперадминку тоже поднял `start-fronts.ts`
      name: 'staff',
      command: 'node scripts/wait-forever.ts',
      url: `http://localhost:${PORTS.staff}`,
      reuseExistingServer: true,
      timeout: 300_000,
    },
  ],
});
