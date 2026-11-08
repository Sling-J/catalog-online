import { getMe, type Me } from '@catalog/contract';
import type { QueryClient } from '@tanstack/react-query';

import { meQueryOptions } from '@/entities/session/api';

/**
 * После входа или регистрации: данные прошлой сессии другому магазину не показываем, аккаунт кладём в кеш.
 * `setQueryData` создаёт запрос без `queryFn`, и потом `invalidateQueries` молча его не перечитывает: `me` так и
 * остаётся «мастер не пройден» (UX-аудит, E1). Поэтому сначала умолчания с `queryFn` — `setQueryData` их подхватит.
 */
export function startSession(queryClient: QueryClient, me: Me): void {
  queryClient.clear();
  const { queryKey, retry } = meQueryOptions();
  queryClient.setQueryDefaults(queryKey, {
    queryFn: async ({ signal }) => (await getMe({ signal, throwOnError: true })).data,
    retry,
  });
  queryClient.setQueryData(queryKey, me);
}
