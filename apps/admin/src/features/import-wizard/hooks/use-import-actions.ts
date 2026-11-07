import {
  applyImport as applyImportRequest,
  cancelImport,
  type ColumnMapping,
  type Import,
  setImportMapping,
} from '@catalog/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyImport, invalidateImports } from '@/entities/import';

/**
 * Действия с открытым импортом: сопоставление колонок (запускает проверку), применение и отмена.
 * Ответ сразу кладём в кеш — шаг меняется без ожидания следующего опроса.
 */
export function useImportActions(importId: string, { onCancelled }: { onCancelled: () => void }) {
  const queryClient = useQueryClient();
  const path = { importId };
  const store = (item: Import) => {
    applyImport(queryClient, item);
    void invalidateImports(queryClient);
  };

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
      void invalidateImports(queryClient);
      onCancelled();
    },
  });
  return { mapping, apply, cancel };
}
