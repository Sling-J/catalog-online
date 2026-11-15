import { staffListShopsInfiniteOptions } from '@catalog/contract/query';
import { infiniteQueryOptions, type QueryClient, type skipToken } from '@tanstack/react-query';

const PAGE = 30;

/** Все магазины, новые сверху, с поиском по названию, адресу и почте и подгрузкой по курсору (FR-S1). */
export const shopsQueryOptions = (q?: string) => {
  const options = staffListShopsInfiniteOptions({ query: { limit: PAGE, ...(q ? { q } : {}) } });
  return infiniteQueryOptions({
    ...options,
    // сгенерированная обёртка не отдаёт skipToken, но тип его допускает
    queryFn: options.queryFn as Exclude<typeof options.queryFn, typeof skipToken | undefined>,
    initialPageParam: {},
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/** После блокировки и разблокировки: статус решает API (разблокировка возвращает прежний), перечитываем списки. */
export const invalidateShops = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) => (query.queryKey[0] as { _id?: string } | undefined)?._id === 'staffListShops',
  });
