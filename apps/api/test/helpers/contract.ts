import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse } from 'yaml';

/** Что увидел один файл тестов — для сводки покрытия после прогона (`global-setup.ts`). */
export type CoverageRecord = { testPath: string; observed: string[] };

/** Ключ пары «операция — код» в сводке покрытия. */
export const coverageKey = (operationId: string, status: number) => `${operationId} ${status}`;

/** Операция контракта, как её видит проверка T-413. */
export type ContractOperation = {
  operationId: string;
  method: string;
  /** Путь в форме Express: `/v1/admin/products/:productId`. */
  path: string;
  /** Коды ответов, объявленные у операции. */
  codes: Set<number>;
  /** Нужна сессия магазина или сотрудника (`security`). */
  secured: boolean;
};

type OpenApi = {
  security?: unknown[];
  paths: Record<
    string,
    Record<string, { operationId?: string; security?: unknown[]; responses?: Record<string, unknown> }>
  >;
};

const CONTRACT = resolve(import.meta.dirname, '../../../../packages/contract/openapi.yaml');
const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

let cached: ContractOperation[] | undefined;

/** Все операции `openapi.yaml`. */
export function contractOperations(): ContractOperation[] {
  if (cached) return cached;
  const doc = parse(readFileSync(CONTRACT, 'utf8')) as OpenApi;
  cached = Object.entries(doc.paths).flatMap(([path, item]) =>
    Object.entries(item)
      .filter(([method, op]) => METHODS.has(method) && op.operationId)
      .map(([method, op]) => ({
        operationId: op.operationId!,
        method: method.toUpperCase(),
        path: path.replace(/\{(\w+)\}/g, ':$1'),
        codes: new Set(Object.keys(op.responses ?? {}).map(Number)),
        secured: (op.security ?? doc.security ?? []).length > 0,
      })),
  );
  return cached;
}

/** Операция по методу и пути маршрута Express или `undefined` (служебный маршрут, маршрута нет). */
export function operationByRoute(method: string, path: string): ContractOperation | undefined {
  return contractOperations().find((op) => op.method === method && op.path === path);
}

/**
 * Общие коды — правилом, а не у каждой операции (api.md, «Коды ответов», решение основателя 2026-11-11): 500 и 429
 * (общий лимит частоты) — у любой, 401 — у закрытой, 403 — у изменяющей (нет `X-Requested-With`). Остальные коды
 * (404, 409, 410, 422…) должны быть объявлены у самой операции.
 */
export function isGlobalCode(op: ContractOperation, status: number): boolean {
  if (status === 500 || status === 429) return true;
  if (status === 401) return op.secured;
  if (status === 403) return op.method !== 'GET';
  return false;
}

/** Код ответа разрешён контрактом: объявлен у операции или общий. */
export function isDeclared(op: ContractOperation, status: number): boolean {
  return op.codes.has(status) || isGlobalCode(op, status);
}
