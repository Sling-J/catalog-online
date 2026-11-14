import type { Import, ListImportsResponse } from '@catalog/contract';
import { type InfiniteData, QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { applyImport, importQueryOptions, importsQueryOptions } from '../import.api';

const item = (id: string, status: Import['status']) => ({ id, status, fileName: `${id}.csv` }) as Import;
const history = (queryClient: QueryClient) =>
  queryClient.getQueryData<InfiniteData<ListImportsResponse>>(importsQueryOptions().queryKey);

describe('applyImport', () => {
  it('импорт — в кеш шага и в историю: новый первым, знакомый — на своём месте (e2e T-502: без перечитывания)', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(importsQueryOptions().queryKey, {
      pages: [{ items: [item('b', 'done'), item('a', 'done')], nextCursor: null }],
      pageParams: [{}],
    });

    applyImport(queryClient, item('c', 'parsing'));
    expect(history(queryClient)?.pages[0]?.items.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
    expect(queryClient.getQueryData(importQueryOptions('c').queryKey)).toEqual(item('c', 'parsing'));

    applyImport(queryClient, item('c', 'previewed'));
    expect(history(queryClient)?.pages[0]?.items.map((entry) => [entry.id, entry.status])).toEqual([
      ['c', 'previewed'],
      ['b', 'done'],
      ['a', 'done'],
    ]);
  });

  it('истории в кеше нет — не создаёт её', () => {
    const queryClient = new QueryClient();
    applyImport(queryClient, item('c', 'parsing'));
    expect(history(queryClient)).toBeUndefined();
  });
});
