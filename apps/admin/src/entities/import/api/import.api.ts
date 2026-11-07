import type { Import } from '@catalog/contract';
import {
  getImportOptions,
  getImportQueryKey,
  listImportErrorsOptions,
  listImportsInfiniteOptions,
} from '@catalog/contract/query';
import { infiniteQueryOptions, queryOptions, type QueryClient, type skipToken } from '@tanstack/react-query';

import { isImportWorking } from '../lib';

/** Как часто спрашиваем API, пока файл читается, проверяется или применяется (импорт идёт в фоне). */
const POLL_MS = 1000;
/** Сколько ошибок показываем на проверке — дальше «и ещё N». */
export const IMPORT_ERRORS_SHOWN = 50;
const HISTORY_PAGE = 20;

/** Импорт по id: пока API работает над ним, ответ перечитывается раз в секунду. */
export const importQueryOptions = (importId: string) =>
  queryOptions({
    ...getImportOptions({ path: { importId } }),
    refetchInterval: (query) => (query.state.data && isImportWorking(query.state.data.status) ? POLL_MS : false),
  });

/** Ответ мутации (`createImport`, `setImportMapping`…) — сразу в кеш шага, без лишнего запроса. */
export function applyImport(queryClient: QueryClient, item: Import): void {
  queryClient.setQueryData(getImportQueryKey({ path: { importId: item.id } }), item);
}

/** Ошибки по строкам для проверки (первая страница). */
export const importErrorsQueryOptions = (importId: string) =>
  listImportErrorsOptions({ path: { importId }, query: { limit: IMPORT_ERRORS_SHOWN } });

/** История импортов, новые сверху, с подгрузкой по курсору. */
export const importsQueryOptions = () => {
  const options = listImportsInfiniteOptions({ query: { limit: HISTORY_PAGE } });
  return infiniteQueryOptions({
    ...options,
    // сгенерированная обёртка не отдаёт skipToken, но тип его допускает
    queryFn: options.queryFn as Exclude<typeof options.queryFn, typeof skipToken | undefined>,
    initialPageParam: {},
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/** Список импортов изменился (новый, отменён, применён) — историю перечитать. */
export function invalidateImports(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: [{ _id: 'listImports' }] });
}
