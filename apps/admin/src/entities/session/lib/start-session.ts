import type { Me } from '@catalog/contract';
import type { QueryClient } from '@tanstack/react-query';

import { meQueryOptions } from '@/entities/session/api';

/** После входа или регистрации: данные прошлой сессии другому магазину не показываем, аккаунт кладём в кеш. */
export function startSession(queryClient: QueryClient, me: Me): void {
  queryClient.clear();
  queryClient.setQueryData(meQueryOptions().queryKey, me);
}
