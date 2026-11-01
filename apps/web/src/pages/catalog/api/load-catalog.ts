import type { I18n } from '@lingui/core';
import type { QueryClient } from '@tanstack/react-query';

import { categoriesQueryOptions } from '@/entities/category';
import {
  productFacetsQueryOptions,
  productsQueryOptions,
  toProductParams,
  type CatalogSearch,
} from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { throwFirstFailure } from '@/shared/api';
import { getSiteOrigin, type PageHead } from '@/shared/lib';

import { catalogHead } from './catalog-head';

/**
 * Предзагрузка данных каталога в загрузчике маршрута: на сервере кладёт их в кеш для первого экрана,
 * на клиенте греет кеш до перехода. Нет магазина — «не найден», каталог скрыт — заглушка магазина.
 * Возвращает заголовок и превью ссылки страницы.
 */
export async function loadCatalog(
  queryClient: QueryClient,
  subdomain: string,
  search: CatalogSearch,
  i18n: I18n,
): Promise<PageHead> {
  const params = toProductParams(search);
  const results = await Promise.allSettled([
    queryClient.ensureQueryData(shopQueryOptions(subdomain)),
    queryClient.ensureQueryData(categoriesQueryOptions(subdomain)),
    queryClient.ensureInfiniteQueryData(productsQueryOptions(subdomain, params)),
    queryClient.ensureQueryData(productFacetsQueryOptions(subdomain, params)),
    // весь магазин без фильтров: подписи выбранных значений в чипах и шторке
    queryClient.ensureQueryData(productFacetsQueryOptions(subdomain)),
  ]);
  throwFirstFailure(results);
  const [shop, categories, products] = results;
  // после throwFirstFailure все запросы выполнены
  if (shop.status !== 'fulfilled' || categories.status !== 'fulfilled' || products.status !== 'fulfilled') {
    throw new Error('unreachable');
  }
  return catalogHead({
    i18n,
    origin: getSiteOrigin(),
    shop: shop.value,
    categories: categories.value,
    search,
    firstCard: products.value.pages[0]?.items[0],
  });
}
