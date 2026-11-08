import type { ListProductsData } from '@catalog/contract';
import { getShopQueryKey, listProductsInfiniteOptions } from '@catalog/contract/query';
import { infiniteQueryOptions, type QueryClient, type skipToken } from '@tanstack/react-query';

import { productCountsQueryOptions } from './product-counts.api';

export type ProductFilter = Exclude<NonNullable<NonNullable<ListProductsData['query']>['filter']>, 'all'>;

/** Порядок списка (FR-A5): новые, по названию, по цене, сначала с маленьким остатком. */
export type ProductSort = NonNullable<NonNullable<ListProductsData['query']>['sort']>;

export const PRODUCT_SORTS: readonly ProductSort[] = ['new', 'name', 'price_asc', 'price_desc', 'stock_asc'];

/** Что выбрано в списке товаров; живёт в адресе страницы. */
export type ProductListParams = { q?: string; categoryId?: string; filter?: ProductFilter; sort?: ProductSort };

export const PRODUCTS_PAGE_SIZE = 30;

/** Список товаров с подгрузкой следующих страниц по курсору (FR-A5). */
export const productsQueryOptions = (params: ProductListParams) => {
  const options = listProductsInfiniteOptions({ query: { ...params, limit: PRODUCTS_PAGE_SIZE } });
  return infiniteQueryOptions({
    ...options,
    // сгенерированная обёртка не отдаёт skipToken, но тип его допускает
    queryFn: options.queryFn as Exclude<typeof options.queryFn, typeof skipToken | undefined>,
    // первая страница — без курсора; следующие SDK подставляет сам из `nextCursor`
    initialPageParam: {},
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/** После правки товаров: перечитать списки, счётчики вкладок и меню, чек-лист магазина. */
export function invalidateProducts(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [{ _id: 'listProducts' }] }),
    queryClient.invalidateQueries({ queryKey: productCountsQueryOptions().queryKey }),
    queryClient.invalidateQueries({ queryKey: getShopQueryKey() }),
  ]).then(() => undefined);
}
