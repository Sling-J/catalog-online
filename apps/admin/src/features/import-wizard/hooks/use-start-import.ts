import { createImport, type Import, listImports } from '@catalog/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { applyImport, invalidateImports, isImportOpen } from '@/entities/import';
import { problemCode, uploadFile } from '@/shared/api';

import { importContentType, type ImportFileProblem, importFileProblem } from '../lib';

/** Почему файл не начал импорт: не тот файл или сбой. */
export type StartImportError = ImportFileProblem | 'failed';

/**
 * Шаг «Файл» (FR-A3, API2): файл едет прямо в хранилище, потом `createImport` — дальше API читает его в фоне.
 * `onStarted` получает импорт, по нему раздел переходит к следующему шагу.
 */
export function useStartImport(onStarted: (item: Import) => void) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<StartImportError | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadId = await uploadFile('import', file, importContentType(file) ?? file.type);
      const { data } = await createImport({ body: { uploadId }, throwOnError: true });
      return data;
    },
    onSuccess: (item) => {
      applyImport(queryClient, item);
      void invalidateImports(queryClient);
      onStarted(item);
    },
    onError: async (failure) => {
      if (problemCode(failure) !== 'import_in_progress') return setError('failed');
      // прошлый импорт не закончен (начат в другой вкладке) — открываем его
      const { data } = await listImports({ query: { limit: 1 } });
      const open = data?.items[0];
      if (open && isImportOpen(open.status)) onStarted(open);
      else setError('failed');
    },
  });

  const start = (file: File | undefined) => {
    if (!file || mutation.isPending) return;
    const problem = importFileProblem(file);
    setError(problem);
    if (problem) return;
    setFileName(file.name);
    mutation.mutate(file);
  };
  return { start, uploading: mutation.isPending, fileName, error };
}
