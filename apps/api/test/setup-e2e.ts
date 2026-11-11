import { afterAll } from 'vitest';

import { saveCoverage } from './helpers/contract-recorder.js';

// Каждый файл e2e после всех тестов отмечается в сводке покрытия контракта (T-413, `helpers/contract-recorder.ts`).
// Vitest 5: файл — второй аргумент хука, первый (контекст фикстур) обязан быть деструктуризацией (pitfalls.md).
// eslint-disable-next-line no-empty-pattern
afterAll(async ({}, suite) => {
  if ('filepath' in suite && typeof suite.filepath === 'string') await saveCoverage(suite.filepath);
});
