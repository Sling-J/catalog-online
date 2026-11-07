import { listProducts, type ProductListItem } from '@catalog/contract';
import { queryOptions } from '@tanstack/react-query';

const PAGE = 100;
/** Больше страниц за раз не читаем — очередь быстрого режима не бесконечна (остальное — в следующий заход). */
const MAX_PAGES = 50;

/**
 * Очередь быстрого режима: все товары без фото (`filter=no_photo`), снятые одним списком при входе. Список
 * не перечитывается, пока человек снимает: добавленное фото убрало бы товар из выборки и сдвинуло очередь.
 */
export const quickQueueQueryOptions = () =>
  queryOptions({
    queryKey: ['quick-photos-queue'],
    queryFn: async (): Promise<ProductListItem[]> => {
      const items: ProductListItem[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const { data } = await listProducts({ query: { filter: 'no_photo', limit: PAGE, cursor }, throwOnError: true });
        items.push(...data.items);
        if (!data.nextCursor) break;
        cursor = data.nextCursor;
      }
      return items;
    },
    staleTime: Infinity,
    gcTime: 0,
  });
