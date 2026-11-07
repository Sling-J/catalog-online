import { createPreviewToken } from '@catalog/contract';

// токен короткоживущий (A7): берём заново, если прошлому больше 10 минут
const TOKEN_FRESH_MS = 10 * 60_000;

/** Токен превью неопубликованной витрины (`POST /admin/preview-token`) — для `?preview=` в адресе iframe. */
export const previewTokenQueryOptions = () => ({
  queryKey: ['preview-token'] as const,
  queryFn: async () => (await createPreviewToken({ throwOnError: true })).data.token,
  staleTime: TOKEN_FRESH_MS,
  gcTime: TOKEN_FRESH_MS,
});
