import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { inject } from 'vitest';

import { coverageKey, isDeclared, operationByRoute, type CoverageRecord } from './contract.js';

/** Пары «операция — код», увиденные всеми приложениями текущего файла тестов (модули Vitest — свои у каждого файла). */
const observedInFile = new Set<string>();

/**
 * Отметка «файл прошёл» с увиденными парами — для сводки покрытия после прогона (`test/contract-coverage.ts`).
 * Пишет `test/setup-e2e.ts` в `afterAll` каждого файла, даже если тот не обращался к операциям контракта: иначе
 * сводка не поймёт, что прошли все файлы.
 */
export async function saveCoverage(testPath: string): Promise<void> {
  const record: CoverageRecord = { testPath, observed: [...observedInFile] };
  await writeFile(join(inject('contractCoverageDir'), `${randomUUID()}.json`), JSON.stringify(record));
}

/**
 * Записывает пары «операция контракта — код ответа» у тестового приложения (T-413). Код, которого нет у операции
 * в `openapi.yaml` и который не общий (`isGlobalCode`), — ошибка: `finish()` бросает её со списком, и файл тестов
 * падает. Маршруты вне контракта (`/health`, служебные контроллеры тестов) не проверяются.
 */
export class ContractRecorder {
  private readonly undeclared = new Set<string>();

  record(method: string, routePath: string | undefined, status: number, url: string): void {
    if (!routePath) return;
    const op = operationByRoute(method, routePath);
    if (!op) return;
    observedInFile.add(coverageKey(op.operationId, status));
    if (!isDeclared(op, status)) this.undeclared.add(`${op.operationId} → ${status} (${method} ${url})`);
  }

  finish(): void {
    if (this.undeclared.size) {
      throw new Error(`Коды ответов не по контракту (openapi.yaml):\n${[...this.undeclared].join('\n')}`);
    }
  }
}
