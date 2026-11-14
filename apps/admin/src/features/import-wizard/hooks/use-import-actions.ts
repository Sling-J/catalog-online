import {
  applyImport as applyImportRequest,
  cancelImport,
  type ColumnMapping,
  type Import,
  setImportMapping,
} from '@catalog/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyImport, importQueryOptions } from '@/entities/import';

/**
 * Действия с открытым импортом: сопоставление колонок (запускает проверку), применение и отмена.
 * Ответ сразу кладём в кеш — шаг меняется без ожидания следующего опроса.
 */
export function useImportActions(importId: string, { onCancelled }: { onCancelled: () => void }) {
  const queryClient = useQueryClient();
  const path = { importId };
  // ответ — в кеш шага и в историю (`applyImport`), без перечитывания списка
  const store = (item: Import) => applyImport(queryClient, item);

  const mapping = useMutation({
    mutationFn: async (value: ColumnMapping[]) =>
      (await setImportMapping({ path, body: { mapping: value }, throwOnError: true })).data,
    onSuccess: store,
  });
  const apply = useMutation({
    mutationFn: async (zeroMissing: boolean) =>
      (await applyImportRequest({ path, body: { zeroMissing }, throwOnError: true })).data,
    onSuccess: store,
  });
  const cancel = useMutation({
    mutationFn: () => cancelImport({ path, throwOnError: true }),
    onSuccess: () => {
      // в историю — статус «отменён» без перечитывания списка
      const item = queryClient.getQueryData(importQueryOptions(importId).queryKey);
      if (item) applyImport(queryClient, { ...item, status: 'cancelled' });
      onCancelled();
    },
  });
  return { mapping, apply, cancel };
}
