import type { StorefrontShopGone } from '@catalog/contract';
import { notFound } from '@tanstack/react-router';

/** Что страница «не найдено» должна знать о причине: товара нет, а магазин на месте, или магазин скрыт. */
export type NotFoundData = { reason: 'product' } | { reason: 'shop_gone'; shop: StorefrontShopGone['shop'] };

// SDK бросает тело ответа с ошибкой (Problem), а не Error — смотрим на его поле status.
const statusOf = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;

export const isNotFoundError = (error: unknown): boolean => statusOf(error) === 404;

export const isGoneError = (error: unknown): error is StorefrontShopGone =>
  statusOf(error) === 410 && typeof error === 'object' && error !== null && 'shop' in error;

export const isNotFoundData = (data: unknown): data is NotFoundData =>
  typeof data === 'object' && data !== null && 'reason' in data;

/**
 * Превращает ошибки предзагрузки в «не найдено» маршрута. Причины смотрим все сразу: когда магазин скрыт
 * (410), остальные запросы отвечают 404, и важно показать заглушку магазина, а не «не найден».
 * `reason: 'product'` — нет только товара (для адреса товара).
 */
export function throwLoadError(error: unknown, reason?: NotFoundData['reason']): never {
  if (isGoneError(error)) throw notFound({ data: { reason: 'shop_gone', shop: error.shop } satisfies NotFoundData });
  if (isNotFoundError(error)) {
    throw notFound(reason === 'product' ? { data: { reason: 'product' } satisfies NotFoundData } : undefined);
  }
  throw error;
}

/** Результаты параллельной предзагрузки: первая причина с приоритетом у «магазин скрыт». */
export function throwFirstFailure(results: PromiseSettledResult<unknown>[], reason?: NotFoundData['reason']): void {
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failures.length === 0) return;
  const gone = failures.find((failure) => isGoneError(failure.reason));
  throwLoadError((gone ?? failures[0])!.reason, reason);
}
