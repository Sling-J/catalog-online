import type { QueryClient } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';

import { categoriesQueryOptions } from '@/entities/category';
import {
  productFacetsQueryOptions,
  productsQueryOptions,
  toProductParams,
  type CatalogSearch,
} from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { isNotFoundError } from '@/shared/api';

/**
 * Предзагрузка данных каталога в загрузчике маршрута: на сервере кладёт их в кеш для первого экрана,
 * на клиенте греет кеш до перехода. Нет магазина — «не найден».
 */
export async function loadCatalog(queryClient: QueryClient, subdomain: string, search: CatalogSearch) {
  const params = toProductParams(search);
  try {
    await Promise.all([
      queryClient.ensureQueryData(shopQueryOptions(subdomain)),
      queryClient.ensureQueryData(categoriesQueryOptions(subdomain)),
      queryClient.ensureInfiniteQueryData(productsQueryOptions(subdomain, params)),
      queryClient.ensureQueryData(productFacetsQueryOptions(subdomain, params)),
      // весь магазин без фильтров: подписи выбранных значений в чипах и шторке
      queryClient.ensureQueryData(productFacetsQueryOptions(subdomain)),
    ]);
  } catch (error) {
    if (isNotFoundError(error)) throw notFound();
    throw error;
  }
}
