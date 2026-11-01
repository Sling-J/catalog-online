import type { ListStorefrontProductsData } from '@catalog/contract';
import {
  getStorefrontFacetsOptions,
  getStorefrontProductOptions,
  listStorefrontProductsInfiniteOptions,
} from '@catalog/contract/query';
import { infiniteQueryOptions, type skipToken } from '@tanstack/react-query';

export type ProductSort = NonNullable<NonNullable<ListStorefrontProductsData['query']>['sort']>;

/** Что выбрал покупатель; всё это живёт в адресе страницы (FR-V4). */
export type ProductListParams = {
  categoryId?: string;
  sort?: ProductSort;
  q?: string;
  /** Id значений свойств (размеры и т.п.). */
  values?: string[];
  priceMin?: number;
  priceMax?: number;
};

export const PRODUCTS_PAGE_SIZE = 30;

/** Сетка товаров с подгрузкой следующих страниц по курсору. */
export const productsQueryOptions = (subdomain: string, params: ProductListParams) => {
  const options = listStorefrontProductsInfiniteOptions({
    path: { subdomain },
    query: { ...params, limit: PRODUCTS_PAGE_SIZE },
  });
  return infiniteQueryOptions({
    ...options,
    // сгенерированная обёртка не отдаёт skipToken, но тип его допускает
    queryFn: options.queryFn as Exclude<typeof options.queryFn, typeof skipToken | undefined>,
    // первая страница — без курсора; следующие SDK подставляет сам из `nextCursor`
    initialPageParam: { path: { subdomain } },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/**
 * Число товаров и значения фильтров, которые есть в выборке. Без параметров — по всему магазину:
 * так подписываем выбранные фильтры, даже если в текущей выборке их уже нет.
 */
export const productFacetsQueryOptions = (subdomain: string, params: ProductListParams = {}) =>
  getStorefrontFacetsOptions({
    path: { subdomain },
    query: {
      categoryId: params.categoryId,
      q: params.q,
      values: params.values,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
    },
  });

/** Карточка товара по короткому коду из адреса. */
export const productQueryOptions = (subdomain: string, shortId: string) =>
  getStorefrontProductOptions({ path: { subdomain, shortId } });
