// Хуки и опции TanStack Query для фронтов.
export * from './gen/@tanstack/react-query.gen.js';

/**
 * Повторы запросов TanStack Query (`defaultOptions.queries.retry` обоих фронтов): при сбое сети и ответе 5xx — до двух
 * раз, ответ 4xx не повторяем — «нет такого магазина» повтор не изменит. С умолчанием (три повтора) страница
 * скрытого магазина слала после гидратации до четырёх напрасных запросов (e2e T-502). SDK бросает тело ответа
 * (Problem) с полем `status`.
 */
export function retryQuery(failureCount: number, error: unknown): boolean {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status: unknown }).status
      : undefined;
  if (typeof status === 'number' && status >= 400 && status < 500) return false;
  return failureCount < 2;
}
