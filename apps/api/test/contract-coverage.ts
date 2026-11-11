import { globSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

import { contractOperations, coverageKey, type CoverageRecord } from './helpers/contract.js';

const ROOT = resolve(import.meta.dirname, '..');
const toPosix = (path: string) => path.split(sep).join('/');

/**
 * Сводка покрытия контракта после прогона e2e (T-413, решение основателя 2026-11-11): каждый код, объявленный у
 * операции в `openapi.yaml`, хоть раз получен в тестах (кроме 500). Проверяется, только если прошли все файлы
 * e2e — при запуске одного файла сводка неполная. Возвращает текст ошибки или `null`.
 */
export function contractCoverageError(dir: string): string | null {
  const records = readdirSync(dir).map(
    (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8')) as CoverageRecord,
  );
  const ran = new Set(records.map((record) => toPosix(relative(ROOT, record.testPath))));
  const all = globSync('src/**/*.e2e.test.ts', { cwd: ROOT }).map(toPosix);
  if (!all.every((path) => ran.has(path))) return null;

  const observed = new Set(records.flatMap((record) => record.observed));
  const missing = contractOperations().flatMap((op) =>
    [...op.codes]
      .filter((code) => code !== 500 && !observed.has(coverageKey(op.operationId, code)))
      .map((code) => `${op.operationId} ${code}`),
  );
  return missing.length
    ? `Коды контракта, которых не получил ни один e2e (${missing.length}):\n${missing.join('\n')}`
    : null;
}
